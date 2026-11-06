import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, DISPLAY, MONO, SAFE, ease, rnd, useFonts, Headline, Label, Grain, EndCard} from './kit';

// B. AWARENESS — 15 s (450 frames). Metaphor: a "random" scatter of marks is really a ring seen edge-on.
// The camera tilts; the scatter resolves into one loop, and the same task keeps coming back to one point.
// The viewer SEES the pattern (frames 90-210) before any explanatory line appears (from 214).
export const B_DURATION = 450;
export const B_END = 300; // settled by 328, held to 450 (4.1 s)

const N = 12;
const R = 370;
const HOT = 0; // the point every lap returns to
const MARKS = Array.from({length: N}, (_, i) => {
  const th = (i / N) * Math.PI * 2 - Math.PI / 2;
  return {th, h: (rnd(i, 21) - 0.5) * 820, label: ['Chase payment', 'Reply', 'Quote', 'Book', 'Post', 'Call', 'File', 'Fix', 'Invoice', 'Email', 'Order', 'Check'][i]};
});
export const B_LAPS = [96, 150, 204, 258]; // frames when the token passes HOT

export const FilmB = () => {
  useFonts();
  const f = useCurrentFrame();
  // tilt: 0deg = side view (height jitter visible, ring hidden) -> 90deg = top view (ring visible)
  const tilt = interpolate(ease(f, 70, 190), [0, 1], [4, 72]);
  const flatten = ease(f, 70, 190); // marks' height jitter collapses as the view resolves
  const sceneOut = ease(f, B_END - 10, B_END + 4);
  // token: laps the ring, one lap every 54 frames, passing HOT at B_LAPS
  const lap = (f - 96) / 54;
  const tokTh = -Math.PI / 2 + lap * Math.PI * 2;
  const cx = 540, cy = 1080;
  const proj = (th: number, h: number) => {
    const x = Math.cos(th) * R, z = Math.sin(th) * R, y = h * (1 - flatten);
    const a = (tilt * Math.PI) / 180;
    // rotate around X: screen y = y*cos(a) + z*sin(a); depth = -y*sin(a)+z*cos(a)
    return {sx: cx + x, sy: cy + y * Math.cos(a) + z * Math.sin(a), d: -y * Math.sin(a) + z * Math.cos(a)};
  };
  const hotPulse = B_LAPS.reduce((m, t) => Math.max(m, f >= t ? Math.exp(-(f - t) / 10) : 0), 0);
  const hot = proj(MARKS[HOT].th, MARKS[HOT].h);
  const ringO = ease(f, 150, 200);
  const tok = proj(tokTh, 0);
  // early on, token wanders erratically (it's the edge-on view of the same loop)
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Grain />
      {/* light sweep that accompanies the tilt */}
      <AbsoluteFill style={{opacity: ease(f, 70, 110) * (1 - ease(f, 190, 230)) * (1 - sceneOut),
        background: `linear-gradient(${105 + f * 0.4}deg, rgba(5,5,5,0) 30%, rgba(216,175,85,0.16) 50%, rgba(5,5,5,0) 70%)`}} />
      <AbsoluteFill style={{opacity: 1 - sceneOut}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <ellipse cx={cx} cy={cy} rx={R} ry={R * Math.sin((tilt * Math.PI) / 180)} fill="none" stroke={C.gold} strokeWidth={4} opacity={ringO * 0.8} strokeDasharray="10 14" />
        </svg>
        {MARKS.map((m, i) => {
          const p = proj(m.th, m.h);
          const isHot = i === HOT;
          const appear = ease(f, 2 + i * 3, 14 + i * 3);
          const sc = 0.85 + (p.d / R) * 0.12;
          return (
            <div key={i} style={{position: 'absolute', left: p.sx - 115, top: p.sy - 40, width: 230, height: 80, opacity: appear * (isHot ? 1 : 1 - 0.55 * ringO),
              transform: `scale(${sc * (isHot ? 1 + hotPulse * 0.25 : 1)})`, background: isHot && f > 90 ? C.white : '#2A2924', zIndex: Math.round(p.d + 1000),
              border: `2px solid ${isHot && f > 90 ? C.gold : '#4A4840'}`, boxShadow: isHot ? `0 0 ${50 * hotPulse}px rgba(216,175,85,${0.8 * hotPulse})` : '0 10px 24px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: isHot && f > 90 ? C.ink : C.white}}>
              {m.label}
            </div>
          );
        })}
        {f >= 96 ? (
          <div style={{position: 'absolute', left: tok.sx - 22, top: tok.sy - 22, width: 44, height: 44, borderRadius: '50%', background: C.gold, zIndex: 3000,
            boxShadow: '0 0 30px rgba(216,175,85,0.9)', opacity: ease(f, 96, 104)}} />
        ) : null}
        {/* lap counter at the hot point: shows recurrence without any claim */}
        {B_LAPS.map((t, k) => (f >= t ? (
          <div key={k} style={{position: 'absolute', left: hot.sx + 130, top: hot.sy - 34 - k * 0, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.gold, zIndex: 3100,
            opacity: ease(f, t, t + 6) * (k === B_LAPS.filter((x) => f >= x).length - 1 ? 1 : 0)}}>{`again ×${k + 1}`}</div>
        ) : null))}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 80 ? <Headline text="What keeps repeating in your business?" start={0} size={96} perWord={2} gold={['repeating']} out={72} /> : null}
        {f >= 212 && f < B_END ? <Headline text="Before you change the system, notice the pattern." start={214} size={92} perWord={2} gold={['pattern']} out={B_END - 8} /> : null}
      </div>
      {f >= B_END - 6 ? (
        <EndCard start={B_END} logo={staticFile('maim-mark.png')} eyebrow="MAIM · ABCs · Awareness" headline="Notice the pattern first." gold={['pattern']}
          cta="Start with Awareness" url="majoraimindset.com" urlSize={46} />
      ) : null}
    </AbsoluteFill>
  );
};
