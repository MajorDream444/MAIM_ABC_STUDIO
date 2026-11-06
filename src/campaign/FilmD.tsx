import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, DISPLAY, MONO, SAFE, ease, useFonts, Headline, Label, Grain, EndCard} from './kit';

// D. CONTEXT — 15 s (450 frames). Metaphor: a camera pull-back. Tight on one stalled task; widening the frame
// reveals three things around it (an unclear request, a missing input, a delayed handoff) that explain the stall.
export const D_DURATION = 450;
export const D_END = 300;

const AROUND = [
  {t: 'Unclear request', icon: '?', x: 270, y: 760, c: C.green},
  {t: 'Missing price list', icon: '—', x: 760, y: 820, c: C.gold},
  {t: 'Waiting on a handoff', icon: '…', x: 540, y: 1470, c: C.blue},
];

export const FilmD = () => {
  useFonts();
  const f = useCurrentFrame();
  // zoom: 2.2x on the stalled card -> 1x (frames 70-190)
  const z = interpolate(ease(f, 70, 190), [0, 1], [2.2, 1]);
  const cx = 540, cy = 1080;
  const sceneOut = ease(f, D_END - 10, D_END + 4);
  const blink = Math.floor(f / 15) % 2 === 0 ? 1 : 0.35;
  const pt = (x: number, y: number) => ({x: cx + (x - cx) * z, y: cy + (y - cy) * z});
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Grain />
      <AbsoluteFill style={{opacity: 1 - sceneOut}}>
        {/* connectors, drawn as the frame widens */}
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          {AROUND.map((a, i) => {
            const p = ease(f, 150 + i * 14, 190 + i * 14);
            const s = pt(cx, cy), e = pt(a.x, a.y);
            return <line key={i} x1={s.x} y1={s.y} x2={s.x + (e.x - s.x) * p} y2={s.y + (e.y - s.y) * p} stroke={a.c} strokeWidth={5} opacity={0.9} />;
          })}
        </svg>
        {AROUND.map((a, i) => {
          const p = pt(a.x, a.y);
          const o = ease(f, 130 + i * 14, 160 + i * 14);
          return (
            <div key={i} style={{position: 'absolute', left: p.x - 170 * z, top: p.y - 80 * z, width: 340, height: 160, transform: `scale(${z})`, transformOrigin: '0 0',
              background: C.ink, borderTop: `10px solid ${a.c}`, opacity: o, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', padding: '20px 26px', boxSizing: 'border-box'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div style={{width: 56, height: 56, border: `3px solid ${a.c}`, color: a.c, fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{a.icon}</div>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, lineHeight: 1.05, color: C.white, width: 220}}>{a.t}</div>
              </div>
            </div>
          );
        })}
        {/* the stalled task */}
        <div style={{position: 'absolute', left: cx - 210 * z, top: cy - 120 * z, width: 420, height: 240, transform: `scale(${z})`, transformOrigin: '0 0',
          background: C.white, borderTop: `12px solid ${C.gold}`, padding: '26px 30px', boxSizing: 'border-box', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', opacity: ease(f, 0, 6)}}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Label size={20} color="#6A6556">Stalled</Label>
            <div style={{width: 16, height: 16, borderRadius: '50%', background: '#B4463C', opacity: blink}} />
          </div>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, color: C.ink, marginTop: 14, lineHeight: 1}}>Finish the proposal</div>
          <div style={{marginTop: 18, height: 8, background: '#D6D0BE'}}><div style={{height: 8, width: `${interpolate(f, [0, 60], [38, 41], {extrapolateRight: 'clamp'})}%`, background: '#8C8676'}} /></div>
          <div style={{fontFamily: MONO, fontSize: 18, color: '#6A6556', marginTop: 8}}>40% · no movement</div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 100 ? <Headline text="You might be solving the wrong problem." start={4} size={96} perWord={2} gold={['wrong']} out={92} /> : null}
        {f >= 212 && f < D_END ? <Headline text="The picture changes when you see what surrounds it." start={214} size={84} perWord={2} gold={['surrounds']} out={D_END - 8} /> : null}
      </div>
      {f >= D_END - 6 ? (
        <EndCard start={D_END} logo={staticFile('maim-mark.png')} eyebrow="MAIM · ABCs · Context" headline="Widen the frame first." gold={['frame']}
          cta="See the bigger picture" url="majoraimindset.com" urlSize={46} />
      ) : null}
    </AbsoluteFill>
  );
};
