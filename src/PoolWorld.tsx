import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// ---------------------------------------------------------------------------
// Geometry (1 unit ~ 1 metre). Water surface sits at y = WATER_Y, coping top at COPING_TOP.
// ---------------------------------------------------------------------------
const HALF_X = 4;
const HALF_Z = 2.2;
const FLOOR_Y = -2.1;
const WATER_Y = -0.14;
const COPING_TOP = 0.3;
const COPING_BOTTOM = -0.12;
const COPING_WIDTH = 0.95;
const WALL_T = 0.5;
const DECK_Y = 0.12;

export const GREEN = '#009B4D';
export const GOLD = '#C9A227';
export const BLUE = '#2E6BE6';

// Awareness, Belief and Context drift through one body of water on looping, non-parallel paths.
const ORBS = [
  {color: GREEN, glow: '#18c46a', ax: 2.15, bx: 0.7, fx: 0.62, px: 0.4, az: 0.8, fz: 0.95, pz: 0.3, fy: 0.9, py: 0.2},
  {color: GOLD, glow: '#e8b92c', ax: 2.35, bx: -0.6, fx: 0.5, px: 2.6, az: 0.9, fz: 1.25, pz: 1.9, fy: 0.7, py: 2.1},
  {color: BLUE, glow: '#4d86ff', ax: 1.7, bx: 0.3, fx: 0.83, px: 4.2, az: 0.75, fz: 0.58, pz: 3.7, fy: 1.1, py: 4.0},
];
const orbPosition = (orb: (typeof ORBS)[number], t: number): [number, number, number] => [
  orb.ax * Math.sin(orb.fx * t + orb.px) + orb.bx * Math.sin(orb.fx * 2.7 * t),
  -1.0 + 0.34 * Math.sin(orb.fy * t + orb.py),
  -0.35 + orb.az * Math.sin(orb.fz * t + orb.pz) + 0.2 * Math.sin(orb.fz * 3.1 * t),
];

// ---------------------------------------------------------------------------
// Procedural textures, built once (deterministic).
// ---------------------------------------------------------------------------
const makeTileTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  // very faint grout, so tiles read as material rather than a grid
  ctx.strokeStyle = 'rgba(40,90,110,0.16)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
  for (let i = 0; i < 1400; i++) {
    const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const x = Math.abs(((Math.sin(i * 78.233) * 43758.5453) % 1)) * size;
    const y = Math.abs(v) * size;
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.abs(v) * 0.07})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const makeCausticTexture = () => {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      // interfering waves -> bright filaments; tileable because every term has integer frequency
      const n = Math.sin(u * 2 + Math.sin(v * 3)) + Math.sin(v * 2 + Math.sin(u * 3)) + Math.sin((u + v) * 2);
      const c = Math.pow(Math.max(0, 1 - Math.abs(n) * 0.9), 4);
      const i = (y * size + x) * 4;
      data[i] = 200; data[i + 1] = 245; data[i + 2] = 255; data[i + 3] = Math.min(255, c * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
};

// ---------------------------------------------------------------------------
// Camera: a slow, low-energy orbit-and-dolly that reveals the depth of the basin.
// ---------------------------------------------------------------------------
export type CameraPose = {frame: number; angle: number; radius: number; height: number; look: [number, number, number]};

// Slow, continuous camera: eases between poses authored per scene so it never fully rests.
const CameraRig = ({poses}: {poses: CameraPose[]}) => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const frames = poses.map((pose) => pose.frame);
  const ease = (key: (pose: CameraPose) => number) => interpolate(frame, frames, poses.map(key), {
    easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const angle = ease((pose) => pose.angle);
  const radius = ease((pose) => pose.radius);
  camera.position.set(Math.sin(angle) * radius, ease((pose) => pose.height), Math.cos(angle) * radius);
  camera.lookAt(ease((pose) => pose.look[0]), ease((pose) => pose.look[1]), ease((pose) => pose.look[2]));
  camera.updateProjectionMatrix();
  return null;
};

// Procedural stand-in for the exploration's pre-rendered normal maps (none exist on disk).
// Tileable: every term has an integer frequency over the texture.
const makeNormalTexture = (terms: [number, number, number, number][]) => {
  const size = 256;
  const height = (u: number, v: number) => terms.reduce((sum, [fu, fv, amp, ph]) => sum + amp * Math.sin(fu * u + fv * v + ph), 0);
  const data = new Uint8Array(size * size * 4);
  const e = (Math.PI * 2) / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x * e;
      const v = y * e;
      const dx = (height(u + e, v) - height(u - e, v)) / (2 * e) / size * 6;
      const dy = (height(u, v + e) - height(u, v - e)) / (2 * e) / size * 6;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = (-dx / len * 0.5 + 0.5) * 255;
      data[i + 1] = (-dy / len * 0.5 + 0.5) * 255;
      data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
};

// Dusk courtyard for reflections: warm horizon, cool zenith, charcoal wall with a gold light slot.
const Environment = () => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const env = new THREE.Scene();
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1d3552'); g.addColorStop(0.45, '#5f7fa3'); g.addColorStop(0.62, '#e2a96a'); g.addColorStop(0.7, '#3a332c'); g.addColorStop(1, '#1c1b1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(canvas), side: THREE.BackSide}));
    env.add(sky);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 9), new THREE.MeshBasicMaterial({color: '#1e1e21'}));
    wall.position.set(0, 3.5, -9);
    env.add(wall);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.45), new THREE.MeshBasicMaterial({color: new THREE.Color(7, 5, 1.8), toneMapped: false}));
    slot.position.set(-1.2, 2.2, -8.95);
    env.add(slot);
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(env, 0.03).texture;
    scene.environmentIntensity = 0.9;
    pmrem.dispose();
  }, [gl, scene]);
  return null;
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const tile = (map: THREE.Texture, repeatX: number, repeatY: number) => {
  const t = map.clone();
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
};

const Basin = ({tileTex}: {tileTex: THREE.Texture}) => {
  const floorMap = useMemo(() => tile(tileTex, 8, 4.4), [tileTex]);
  const wallLong = useMemo(() => tile(tileTex, 8, 2.1), [tileTex]);
  const wallShort = useMemo(() => tile(tileTex, 4.4, 2.1), [tileTex]);
  const H = WATER_Y - FLOOR_Y + 0.3;
  const wallY = FLOOR_Y + H / 2 - 0.02;
  const ix = HALF_X * 2;
  const iz = HALF_Z * 2;
  const tileMat = (map: THREE.Texture, color: string) => <meshStandardMaterial map={map} color={color} roughness={0.42} metalness={0.04}/>;
  return <group>
    {/* floor */}
    <mesh position={[0, FLOOR_Y - 0.1, 0]} receiveShadow><boxGeometry args={[ix + WALL_T * 2, 0.2, iz + WALL_T * 2]}/>{tileMat(floorMap, '#5eb7d1')}</mesh>
    {/* walls (inner faces tinted, deeper = more saturated blue via colour only, never black) */}
    <mesh position={[0, wallY, -HALF_Z - WALL_T / 2]} receiveShadow castShadow><boxGeometry args={[ix + WALL_T * 2, H, WALL_T]}/>{tileMat(wallLong, '#8cd0e0')}</mesh>
    <mesh position={[0, wallY, HALF_Z + WALL_T / 2]} receiveShadow castShadow><boxGeometry args={[ix + WALL_T * 2, H, WALL_T]}/>{tileMat(wallLong, '#6dbcd3')}</mesh>
    <mesh position={[-HALF_X - WALL_T / 2, wallY, 0]} receiveShadow castShadow><boxGeometry args={[WALL_T, H, iz]}/>{tileMat(wallShort, '#7ccbdc')}</mesh>
    <mesh position={[HALF_X + WALL_T / 2, wallY, 0]} receiveShadow castShadow><boxGeometry args={[WALL_T, H, iz]}/>{tileMat(wallShort, '#68b9d0')}</mesh>
  </group>;
};

// Thick coping with a rounded-looking bevel from a second, slightly inset slab.
const Coping = () => {
  const mat = <meshStandardMaterial color="#d9ccb0" roughness={0.55} metalness={0.02}/>;
  const matShade = <meshStandardMaterial color="#c4b79c" roughness={0.58}/>;
  const t = COPING_TOP - COPING_BOTTOM;
  const cy = (COPING_TOP + COPING_BOTTOM) / 2;
  const lenX = HALF_X * 2 + COPING_WIDTH * 2;
  const lenZ = HALF_Z * 2;
  const off = COPING_WIDTH / 2;
  return <group>
    <mesh position={[0, cy, -HALF_Z - off + 0.06]} castShadow receiveShadow><boxGeometry args={[lenX, t, COPING_WIDTH]}/>{mat}</mesh>
    <mesh position={[0, cy, HALF_Z + off - 0.06]} castShadow receiveShadow><boxGeometry args={[lenX, t, COPING_WIDTH]}/>{matShade}</mesh>
    <mesh position={[-HALF_X - off + 0.06, cy, 0]} castShadow receiveShadow><boxGeometry args={[COPING_WIDTH, t, lenZ - 0.12]}/>{mat}</mesh>
    <mesh position={[HALF_X + off - 0.06, cy, 0]} castShadow receiveShadow><boxGeometry args={[COPING_WIDTH, t, lenZ - 0.12]}/>{matShade}</mesh>
  </group>;
};

// Deck surrounds the coping on all four sides; the basin itself stays open.
const Deck = () => {
  const outerX = HALF_X + COPING_WIDTH - 0.06;
  const outerZ = HALF_Z + COPING_WIDTH - 0.06;
  const mat = <meshStandardMaterial color="#9b8f78" roughness={0.88}/>;
  const y = DECK_Y - 0.25;
  const big = 40;
  return <group>
    <mesh position={[0, y, -outerZ - big / 2]} receiveShadow><boxGeometry args={[big * 2 + outerX * 2, 0.5, big]}/>{mat}</mesh>
    <mesh position={[0, y, outerZ + big / 2]} receiveShadow><boxGeometry args={[big * 2 + outerX * 2, 0.5, big]}/>{mat}</mesh>
    <mesh position={[-outerX - big / 2, y, 0]} receiveShadow><boxGeometry args={[big, 0.5, outerZ * 2]}/>{mat}</mesh>
    <mesh position={[outerX + big / 2, y, 0]} receiveShadow><boxGeometry args={[big, 0.5, outerZ * 2]}/>{mat}</mesh>
  </group>;
};

// Three submerged steps in the shallow corner, flush with the left wall.
const Steps = () => {
  const mat = <meshStandardMaterial color="#9fd3e0" roughness={0.45}/>;
  const steps = [
    {w: 0.9, top: -0.72}, {w: 1.8, top: -1.22}, {w: 2.7, top: -1.72},
  ];
  const zc = HALF_Z - 1.35;
  return <group>
    {steps.map((s) => {
      const h = s.top - FLOOR_Y;
      return <mesh key={s.top} position={[-HALF_X + s.w / 2, FLOOR_Y + h / 2, zc]} castShadow receiveShadow><boxGeometry args={[s.w, h, 2.7]}/>{mat}</mesh>;
    })}
  </group>;
};

// Tubular ladder: each rail is one continuous path that starts in a flange on the coping,
// rises, arcs over the pool edge and runs down the wall to a bracket. Treads join the rails.
const RAIL_R = 0.045;
const LADDER_X = [1.95, 2.55];
const LADDER_ANCHOR_Z = -HALF_Z - 0.62; // on the coping
const LADDER_WALL_Z = -HALF_Z + 0.2;    // rail run just off the wall
const railPath = (x: number) => {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const baseY = COPING_TOP;
  const top = 1.0;
  const a = new THREE.Vector3(x, baseY, LADDER_ANCHOR_Z);
  const b = new THREE.Vector3(x, top - 0.25, LADDER_ANCHOR_Z);
  const c = new THREE.Vector3(x, top, LADDER_ANCHOR_Z + 0.05);
  const d = new THREE.Vector3(x, top, LADDER_WALL_Z - 0.38);
  const e = new THREE.Vector3(x, top - 0.28, LADDER_WALL_Z);
  const f = new THREE.Vector3(x, -1.45, LADDER_WALL_Z);
  path.add(new THREE.LineCurve3(a, b));
  path.add(new THREE.QuadraticBezierCurve3(b, c.clone().setY(top + 0.02), c));
  path.add(new THREE.LineCurve3(c, d));
  path.add(new THREE.QuadraticBezierCurve3(d, new THREE.Vector3(x, top, LADDER_WALL_Z), e));
  path.add(new THREE.LineCurve3(e, f));
  return path;
};
const Ladder = () => {
  const rails = useMemo(() => LADDER_X.map(railPath), []);
  const steel = <meshStandardMaterial color="#d9dde0" metalness={0.92} roughness={0.2} envMapIntensity={1.4}/>;
  const mid = (LADDER_X[0] + LADDER_X[1]) / 2;
  const span = LADDER_X[1] - LADDER_X[0];
  return <group>
    {rails.map((p, i) => <mesh key={i} castShadow><tubeGeometry args={[p, 160, RAIL_R, 18, false]}/>{steel}</mesh>)}
    {/* flanges bolting each rail to the coping, and wall brackets at the lower ends */}
    {LADDER_X.map((x) => <React.Fragment key={x}>
      <mesh position={[x, COPING_TOP + 0.015, LADDER_ANCHOR_Z]} castShadow receiveShadow><cylinderGeometry args={[0.13, 0.15, 0.03, 32]}/>{steel}</mesh>
      <mesh position={[x, COPING_TOP + 0.05, LADDER_ANCHOR_Z]}><cylinderGeometry args={[0.07, 0.07, 0.04, 24]}/>{steel}</mesh>
      <mesh position={[x, -1.35, (LADDER_WALL_Z - HALF_Z) / 2 - 0.0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, LADDER_WALL_Z + HALF_Z, 14]}/>{steel}</mesh>
      <mesh position={[x, -1.35, -HALF_Z + 0.015]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.03, 24]}/>{steel}</mesh>
    </React.Fragment>)}
    {/* treads (the upper one is above water, the rest submerged) */}
    {[0.25, -0.35, -0.85, -1.3].map((y) => <mesh key={y} position={[mid, y, LADDER_WALL_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, span, 14]}/>{steel}
    </mesh>)}
  </group>;
};

// Ripple sources are emitted from wherever each thought currently is, so they cross freely.
const RIPPLE_SPEED = 0.9;
const RIPPLE_LIFE = 3.4;
type Ripple = {x: number; z: number; age: number; power: number};
export type HookRipple = {x: number; z: number; t: number; power?: number};
const ripplesAt = (t: number, lineUntilS: number, entries?: number[], hooks?: HookRipple[]): Ripple[] => {
  const out: Ripple[] = [];
  (hooks ?? []).forEach((h) => { const age = t - h.t; if (age >= 0 && age <= RIPPLE_LIFE) out.push({x: h.x, z: h.z, age, power: h.power ?? 1.6}); });
  ORBS.forEach((_, index) => {
    const period = 1.8 + index * 0.37;
    const last = Math.floor(t / period + 0.17 * index);
    for (let k = last; k > last - 3; k--) {
      const born = (k - 0.17 * index) * period;
      const age = t - born;
      if (age < 0 || age > RIPPLE_LIFE) continue;
      const e = entryAt(index, born, lineUntilS, entries);
      if (e.v <= 0 || e.p[1] > WATER_Y + 0.2) continue;
      const [x, y, z] = e.p;
      const near = (y + 1.35) / 0.73;
      out.push({x, z, age, power: 0.45 + 0.55 * Math.min(1, Math.max(0, near))});
    }
  });
  return out;
};

// Water surface: scrolling normal maps (two speeds, crossed angles) + damped intersecting ripple rings.
const WaterSurface = ({lineUntilS, entries, hooks}: {lineUntilS: number; entries?: number[]; hooks?: HookRipple[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const geom = useMemo(() => new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2, 200, 110).rotateX(-Math.PI / 2), []);
  const normalA = useMemo(() => {
    const tex = makeNormalTexture([[3, 1, 1, 0.4], [1, 4, 0.8, 2.1], [5, 3, 0.45, 4.2], [7, -2, 0.3, 1.1]]);
    tex.repeat.set(3.2, 1.8);
    return tex;
  }, []);
  const normalB = useMemo(() => {
    const tex = makeNormalTexture([[-2, 3, 1, 1.3], [4, -1, 0.7, 3.4], [2, 6, 0.4, 0.2], [-6, 2, 0.3, 5.1]]);
    tex.repeat.set(2.1, 1.2);
    return tex;
  }, []);
  // 0.02 and 0.035 UV/s along crossed directions
  normalA.offset.set(t * 0.02 * 0.94, t * 0.02 * 0.34);
  normalB.offset.set(-t * 0.035 * 0.5, t * 0.035 * 0.87);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const ripples = ripplesAt(t, lineUntilS, entries, hooks);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = 0.004 * Math.sin(x * 1.3 + t * 0.8) + 0.003 * Math.sin(z * 1.9 - t * 0.7 + x * 0.6);
    for (const r of ripples) {
      const d = Math.hypot(x - r.x, z - r.z) - RIPPLE_SPEED * r.age;
      if (d > 0.9 || d < -1.6) continue;
      const fadeIn = Math.min(1, r.age / 0.35);
      h += 0.024 * r.power * fadeIn * Math.exp(-r.age / 1.4) * Math.exp(-(d * d) / 0.18) * Math.cos(d * 9);
    }
    pos.setY(i, h);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return <mesh geometry={geom} position={[0, WATER_Y, 0]} renderOrder={2}>
    <meshPhysicalMaterial color="#2f9fc8" transparent opacity={0.42} roughness={0.05} metalness={0} ior={1.33} specularIntensity={1}
      normalMap={normalA} normalScale={new THREE.Vector2(0.22, 0.22)}
      clearcoat={1} clearcoatRoughness={0.06} clearcoatNormalMap={normalB} clearcoatNormalScale={new THREE.Vector2(0.18, 0.18)}
      envMapIntensity={0.7} depthWrite={false}/>
  </mesh>;
};

// Depth absorption: shallow #5CC0D8 -> mid #2A8DBD -> deep #0C4775, shown on the far inner faces.
const volumeVertex = `varying float vY; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`;
const volumeFragment = `
  varying float vY; uniform float uTop; uniform float uBottom; uniform vec3 uShallow; uniform vec3 uMid; uniform vec3 uDeep;
  void main(){
    float d = clamp((uTop - vY) / (uTop - uBottom), 0.0, 1.0);
    vec3 c = mix(uShallow, uMid, smoothstep(0.0, 0.5, d));
    c = mix(c, uDeep, smoothstep(0.35, 1.0, d));
    gl_FragColor = vec4(c, 0.16 + 0.4 * d);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const WaterVolume = () => {
  const uniforms = useMemo(() => ({
    uTop: {value: WATER_Y}, uBottom: {value: FLOOR_Y},
    uShallow: {value: new THREE.Color('#5CC0D8')}, uMid: {value: new THREE.Color('#2A8DBD')}, uDeep: {value: new THREE.Color('#0C4775')},
  }), []);
  return <mesh position={[0, (WATER_Y + FLOOR_Y) / 2, 0]} renderOrder={1}>
    <boxGeometry args={[HALF_X * 2 - 0.02, WATER_Y - FLOOR_Y, HALF_Z * 2 - 0.02]}/>
    <shaderMaterial vertexShader={volumeVertex} fragmentShader={volumeFragment} uniforms={uniforms} transparent side={THREE.BackSide} depthWrite={false}/>
  </mesh>;
};

// Restrained gold in the courtyard: a light slot on the charcoal wall and a soft strip under the water.
const COURT_WALL_Z = -7.4;
const Courtyard = () => {
  const frame = useCurrentFrame();
  const pulse = 0.75 + 0.25 * Math.sin((frame / 30) * 0.9);
  return <group>
    <mesh position={[0, 2.6, COURT_WALL_Z]} receiveShadow><boxGeometry args={[48, 6.4, 0.6]}/><meshStandardMaterial color="#2a2a2e" roughness={0.88}/></mesh>
    <mesh position={[-1.2, 2.2, COURT_WALL_Z + 0.32]}><boxGeometry args={[7, 0.3, 0.04]}/><meshBasicMaterial color={new THREE.Color(1.0, 0.8, 0.42)} toneMapped={false}/></mesh>
    <pointLight position={[-1.2, 2.2, COURT_WALL_Z + 1.2]} color="#ffbf66" intensity={55} distance={16} decay={1.7}/>
    <mesh position={[-1.5, -1.15, -HALF_Z + 0.03]}><boxGeometry args={[2.6, 0.05, 0.03]}/><meshBasicMaterial color={new THREE.Color(1.0, 0.78, 0.38).multiplyScalar(0.5 + 0.5 * pulse)} toneMapped={false}/></mesh>
    <pointLight position={[-1.5, -1.1, -HALF_Z + 0.5]} color="#ffc066" intensity={2.2 * pulse} distance={3.5} decay={1.8}/>
  </group>;
};

const Caustics = ({tex}: {tex: THREE.Texture}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const a = useMemo(() => tile(tex, 3, 1.7), [tex]);
  const b = useMemo(() => tile(tex, 2.2, 1.2), [tex]);
  a.offset.set(t * 0.035, t * 0.02);
  b.offset.set(-t * 0.025, t * 0.03);
  return <group>
    <mesh position={[0, FLOOR_Y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[HALF_X * 2, HALF_Z * 2]}/><meshBasicMaterial map={a} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
    <mesh position={[0, FLOOR_Y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[HALF_X * 2, HALF_Z * 2]}/><meshBasicMaterial map={b} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
  </group>;
};

const smooth = (x: number) => x * x * (3 - 2 * x);
// Opening beat: the three sit in a straight line, then are released into their own loops.
const orbAt = (index: number, t: number, lineUntilS: number): [number, number, number] => {
  const loop = orbPosition(ORBS[index], t);
  if (lineUntilS <= 0) return loop;
  const release = smooth(Math.min(1, Math.max(0, (t - lineUntilS) / 4)));
  if (release >= 1) return loop;
  const line: [number, number, number] = [-1.9 + index * 1.9 + Math.sin(t * 0.3) * 0.15, -1.0, -0.35];
  return [line[0] + (loop[0] - line[0]) * release, line[1] + (loop[1] - line[1]) * release, line[2] + (loop[2] - line[2]) * release];
};

// Optional entrances (campaign Film A): each thought arrives by its own way in, then joins its loop.
// Awareness (green) walks in across the deck and down the steps; Belief (gold) climbs down the ladder;
// Context (blue) rises from the depth. Without `entries` the scene behaves exactly as before.
const DOORS: [number, number, number][][] = [
  [[-4.9, 0.55, 0.85], [-2.2, -0.95, 0.85]],
  [[2.25, 1.2, -2.6], [2.25, -0.95, -1.75]],
  [[2.9, -2.0, 0.4], [2.4, -1.25, 0.1]],
];
const ENTRY_S = 2.6;
const lerp3 = (a: number[], b: number[], u: number): [number, number, number] => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const entryAt = (index: number, t: number, lineUntilS: number, entries?: number[]): {p: [number, number, number]; v: number} => {
  const at = entries?.[index];
  if (at === undefined) return {p: orbAt(index, t, lineUntilS), v: 1};
  if (t < at) return {p: DOORS[index][0], v: 0};
  const u = (t - at) / ENTRY_S;
  const loop = orbAt(index, t, lineUntilS);
  if (u >= 1) return {p: loop, v: 1};
  const [a, b] = DOORS[index];
  const p = u < 0.5 ? lerp3(a, b, smooth(u * 2)) : lerp3(b, loop, smooth((u - 0.5) * 2));
  return {p, v: Math.min(1, u * 5)};
};

const Orbs = ({lineUntilS, entries}: {lineUntilS: number; entries?: number[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return <>
    {ORBS.map((orb, index) => {
      const {p: [x, y, z], v} = entryAt(index, t, lineUntilS, entries);
      if (v <= 0) return null;
      const nearSurface = interpolate(y, [-1.35, -0.62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return <group key={orb.color}>
        <mesh position={[x, y, z]} scale={v}><sphereGeometry args={[0.24, 40, 40]}/><meshStandardMaterial color={orb.color} emissive={orb.glow} emissiveIntensity={0.9} roughness={0.25}/></mesh>
        <mesh position={[x, y, z]}><sphereGeometry args={[0.42, 32, 32]}/><meshBasicMaterial color={orb.color} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
        <pointLight position={[x, y, z]} color={orb.glow} intensity={4 * v} distance={4.2} decay={1.6}/>
        {/* fading trail: where the thought has just been */}
        {Array.from({length: 14}, (_, k) => {
          const tr = entryAt(index, t - (k + 1) * 0.11, lineUntilS, entries);
          if (tr.v <= 0) return null;
          const [tx, ty, tz] = tr.p;
          return <mesh key={k} position={[tx, ty, tz]} scale={1 - k / 15}><sphereGeometry args={[0.07, 14, 14]}/><meshBasicMaterial color={orb.glow} transparent opacity={0.5 * (1 - k / 14)} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>;
        })}
      </group>;
    })}
  </>;
};

export const PoolScene = ({poses, lineUntilS = 0, entries, hooks}: {poses: CameraPose[]; lineUntilS?: number; entries?: number[]; hooks?: HookRipple[]}) => {
  const tileTex = useMemo(makeTileTexture, []);
  const causticTex = useMemo(makeCausticTexture, []);
  return <>
    <CameraRig poses={poses}/>
    <Environment/>
    <color attach="background" args={['#1a2431']}/>
    <fog attach="fog" args={['#1a2431', 22, 52]}/>
    <hemisphereLight args={['#9db8d8', '#2a2a2f', 0.5]}/>
    <directionalLight position={[-4, 6, -9]} intensity={1.15} color="#ffbd70" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096}
      shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={1} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.03}/>
    <directionalLight position={[6, 5, 8]} intensity={0.5} color="#a8c4e6"/>
    <Deck/>
    <Basin tileTex={tileTex}/>
    <Steps/>
    <Coping/>
    <Ladder/>
    <Caustics tex={causticTex}/>
    <Orbs lineUntilS={lineUntilS} entries={entries}/>
    <Courtyard/>
    <WaterVolume/>
    <WaterSurface lineUntilS={lineUntilS} entries={entries} hooks={hooks}/>
  </>;
};

