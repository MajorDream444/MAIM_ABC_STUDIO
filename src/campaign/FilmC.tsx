import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {C, SAFE, ease, useFonts, Headline, Grain, EndCard, clamp} from './kit';

// C. BELIEF — 15 s (450 frames). Metaphor: a wall that looks solid from where you stand is really two
// offset panels. When the viewpoint changes, an opening appears and light comes through. The panels stay:
// the constraint is real, the way through was there all along.
export const C_DURATION = 450;
export const C_END = 300;
export const C_THUD = 12;
const WA = {x: 20, w: 820};
const WB = {x: 540, w: 640, h: 640, y: 10};
const CAM0 = 0;

const Box = ({x, y, z, w, h, d, front = '#2C2B27', side = '#1A1916', top = '#3B3934'}: {x: number; y: number; z: number; w: number; h: number; d: number; front?: string; side?: string; top?: string}) => {
  const face = (t: string, ww: number, hh: number, bg: string): React.CSSProperties => ({position: 'absolute', left: -ww / 2, top: -hh / 2, width: ww, height: hh, background: bg, transform: t, backfaceVisibility: 'hidden'});
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translate3d(${x}px, ${y}px, ${z}px)`}}>
      <div style={face(`translateZ(${d / 2}px)`, w, h, `linear-gradient(180deg, ${front}, #12110F)`)} />
      <div style={face(`rotateY(180deg) translateZ(${d / 2}px)`, w, h, side)} />
      <div style={face(`rotateY(90deg) translateZ(${w / 2}px)`, d, h, `linear-gradient(180deg, ${side}, #0B0B0A)`)} />
      <div style={face(`rotateY(-90deg) translateZ(${w / 2}px)`, d, h, `linear-gradient(180deg, ${side}, #0B0B0A)`)} />
      <div style={face(`rotateX(90deg) translateZ(${h / 2}px)`, w, d, top)} />
    </div>
  );
};

export const FilmC = () => {
  useFonts();
  const f = useCurrentFrame();
  const drop = interpolate(f, [0, C_THUD], [-1400, 0], {...clamp, easing: Easing.in(Easing.quad)});
  const bounce = f > C_THUD && f < C_THUD + 10 ? Math.sin(((f - C_THUD) / 10) * Math.PI) * -14 : 0;
  const shake = f > C_THUD && f < C_THUD + 8 ? Math.sin(f * 3) * 6 * (1 - (f - C_THUD) / 8) : 0;
  const cam = interpolate(ease(f, 100, 220), [0, 1], [CAM0, -40]);
  const push = interpolate(f, [0, 100, 220, 300], [450, 470, 40, 110], {...clamp, easing: Easing.inOut(Easing.sin)});
  const light = ease(f, 150, 230);
  // token walks into the opening (frames 220-296)
  const tp = ease(f, 220, 296, 0, 1, Easing.inOut(Easing.sin));
  const tx = interpolate(tp, [0, 0.35, 1], [WA.x + WA.w / 2 + 110, WA.x + WA.w / 2 + 110, WA.x - WA.w / 2 - 60]);
  const tz = interpolate(tp, [0, 0.35, 1], [380, -165, -165]);
  const sceneOut = ease(f, C_END - 10, C_END + 4);
  const dust = f > C_THUD && f < C_THUD + 30 ? 1 - (f - C_THUD) / 30 : 0;
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Grain />
      <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '540px 900px', opacity: 1 - sceneOut, transform: `translateX(${shake}px)`}}>
        <div style={{position: 'absolute', left: 540, top: 1120, transformStyle: 'preserve-3d', transform: `translateX(${interpolate(ease(f, 100, 220), [0, 1], [0, -330])}px) translateZ(${push - 200}px) rotateX(-14deg) rotateY(${cam}deg)`}}>
          {/* floor */}
          <div style={{position: 'absolute', left: -1400, top: -1400, width: 2800, height: 2800, transform: 'translateY(330px) rotateX(90deg)',
            background: `radial-gradient(circle at 50% 50%, #1D1C19 0%, #0A0A09 55%, #050505 75%)`}} />
          {/* light pool on the floor in the corridor between panels */}
          <div style={{position: 'absolute', left: -700, top: -200, width: 1400, height: 400, transform: 'translate3d(0, 328px, -150px) rotateX(90deg)', opacity: light,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(216,175,85,0.55), rgba(216,175,85,0) 70%)'}} />
          {/* gold light behind the walls, visible only through the opening */}
          <div style={{position: 'absolute', left: 0, top: -560, width: 620, height: 960, transform: 'translateZ(-760px)', opacity: 0.35 + 0.65 * light,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(240,205,120,0.95), rgba(216,175,85,0.25) 45%, rgba(5,5,5,0) 75%)', filter: 'blur(8px)'}} />
          {/* back panel (offset right, further away) and front panel (offset left): one wall from the front */}
          <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `translateY(${drop + bounce}px)`}}>
            <Box x={WB.x} y={WB.y} z={-330} w={WB.w} h={WB.h} d={60} />
            <Box x={WA.x} y={-30} z={0} w={WA.w} h={720} d={60} front="#302F2A" />
          </div>
          {/* contact shadow under the walls */}
          <div style={{position: 'absolute', left: -500, top: -120, width: 1500, height: 240, transform: 'translate3d(0, 329px, -160px) rotateX(90deg)', opacity: ease(f, C_THUD - 2, C_THUD + 2),
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.85), rgba(0,0,0,0) 70%)'}} />
          {/* token */}
          {f >= 210 ? (
            <div style={{position: 'absolute', left: -26, top: -26, width: 52, height: 52, borderRadius: '50%', transform: `translate3d(${tx}px, 300px, ${tz}px)`,
              background: `radial-gradient(circle at 35% 30%, #F6DE9C, ${C.gold} 50%, #8C6A22)`, boxShadow: '0 0 40px rgba(216,175,85,0.9)', opacity: ease(f, 210, 222)}} />
          ) : null}
        </div>
        {/* impact dust */}
        <div style={{position: 'absolute', left: 140, top: 1380, width: 800, height: 140, opacity: dust * 0.6, filter: 'blur(24px)',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(180,170,150,0.6), rgba(0,0,0,0) 70%)'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 98 ? <Headline text="What have you already decided you can't do?" start={4} size={96} perWord={2} gold={['decided']} out={90} /> : null}
        {f >= 222 && f < C_END ? <Headline text="What you believe shapes what you try." start={224} size={96} perWord={2} gold={['believe']} out={C_END - 8} /> : null}
      </div>
      {f >= C_END - 6 ? (
        <EndCard start={C_END} logo={staticFile('maim-mark.png')} eyebrow="MAIM · ABCs · Belief" headline="Look again before you decide." gold={['again']}
          cta="Explore Belief with MAIM" url="majoraimindset.com" urlSize={46} />
      ) : null}
    </AbsoluteFill>
  );
};
