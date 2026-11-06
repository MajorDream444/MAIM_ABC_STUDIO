import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CameraPose, PoolScene, HookRipple} from '../PoolWorld';
import {C, SAFE, ease, useFonts, Headline, Label, EndCard} from './kit';

// A. THE THINKING POOL — 18 s (540 frames). Same courtyard, water, stone and brass as the approved Thinking Pool.
// Awareness (green) enters by the steps, Belief (gold) by the ladder, Context (blue) rises from the depth.
// No order or ranking: each arrives its own way and they share one body of water.
export const A_DURATION = 540;
export const A_END = 390;
const ENTRIES = [0.35, 4.7, 8.6]; // seconds
const HOOKS: HookRipple[] = [{x: -2.7, z: 0.85, t: 0.02, power: 2.2}, {x: -1.6, z: 0.3, t: 0.5, power: 1.4}];

const POSES: CameraPose[] = [
  {frame: 0, angle: -0.8, radius: 6.0, height: 2.4, look: [-2.6, -0.7, 0.6]},
  {frame: 120, angle: -0.6, radius: 6.2, height: 2.8, look: [-2.0, -0.8, 0.4]},
  {frame: 210, angle: 0.55, radius: 6.2, height: 2.7, look: [2.1, -0.5, -1.5]},
  {frame: 250, angle: 0.5, radius: 6.0, height: 3.0, look: [2.2, -0.7, -1.4]},
  {frame: 320, angle: 0.25, radius: 5.2, height: 6.4, look: [2.2, -1.8, 0.1]},
  {frame: 400, angle: 0.0, radius: 7.6, height: 9.6, look: [0, -1.0, -0.3]},
  {frame: 540, angle: 0.1, radius: 7.9, height: 10.0, look: [0, -1.0, -0.3]},
];

const Way = ({from, to, color, text}: {from: number; to: number; color: string; text: string}) => {
  const f = useCurrentFrame();
  const o = ease(f, from, from + 10) * (1 - ease(f, to - 10, to));
  return (
    <div style={{position: 'absolute', left: SAFE.x, top: 1430, display: 'flex', alignItems: 'center', gap: 20, opacity: o, transform: `translateY(${(1 - ease(f, from, from + 10)) * 20}px)`,
      background: 'rgba(5,5,5,0.72)', padding: '18px 28px'}}>
      <div style={{width: 30, height: 30, borderRadius: '50%', background: color, boxShadow: `0 0 24px ${color}`}} />
      <Label size={32} color={C.white}>{text}</Label>
    </div>
  );
};

export const FilmA = () => {
  useFonts();
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const dim = ease(f, A_END - 14, A_END + 4);
  return (
    <AbsoluteFill style={{backgroundColor: C.black}}>
      <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}} camera={{fov: 50, near: 0.1, far: 60, position: [0, 8, 9]}}>
        <PoolScene poses={POSES} entries={ENTRIES} hooks={HOOKS} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.55) 22%, rgba(5,5,5,0) 38%, rgba(5,5,5,0) 68%, rgba(5,5,5,0.7) 100%)'}} />
      <AbsoluteFill style={{background: C.black, opacity: dim * 0.86}} />
      <Way from={50} to={150} color="#18c46a" text="Awareness · by the steps" />
      <Way from={160} to={262} color="#e8b92c" text="Belief · by the ladder" />
      <Way from={272} to={350} color="#4d86ff" text="Context · from the depth" />
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 150 ? <Headline text="You don't have to start in the same place." start={2} size={92} perWord={2} gold={['start']} out={142} /> : null}
        {f >= 316 && f < A_END ? <Headline text="Different ways in. One evolving mindset." start={318} size={92} perWord={2} gold={['one']} out={A_END - 8} /> : null}
      </div>
      {f >= A_END - 6 ? (
        <EndCard start={A_END} logo={staticFile('maim-mark.png')} eyebrow="MAIM · The ABCs" headline="Come back to any letter, any time." gold={['any']}
          cta="Explore the MAIM mindset" url="majoraimindset.com" urlSize={46} />
      ) : null}
    </AbsoluteFill>
  );
};
