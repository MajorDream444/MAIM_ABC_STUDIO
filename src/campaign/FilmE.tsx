import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, DISPLAY, MONO, SAFE, ease, rnd, useFonts, Headline, Label, Grain, EndCard} from './kit';

// E. THINK. BUILD. — 20 s (600 frames). MAIM -> Academy version (no Spark Lab).
// Metaphor: scattered chat fragments gather into one structured intake, become a drafted reply, and wait for a
// visible human approval. Then the two connected options: MAIM (think clearly) and Academy (build practically).
// Illustrative artifact only: no client data, no results claimed.
export const E_DURATION = 600;
export const E_END = 450;

const BUBBLES = ['hi, can you help?', 'price for 3 people?', 'maybe next week', 'saw your post', 'is it online?', 'what do I need?'];
const FIELDS = [
  {k: 'Need', v: 'Group workshop'},
  {k: 'Size', v: '3 people'},
  {k: 'Format', v: 'Online'},
  {k: 'Timing', v: 'Next week'},
];

export const FilmE = () => {
  useFonts();
  const f = useCurrentFrame();
  const gather = ease(f, 110, 160);
  const formIn = ease(f, 140, 170);
  const toDraft = ease(f, 236, 266); // form slides up-left, draft appears
  const stamp = ease(f, 288, 296);
  const workOut = ease(f, 346, 360);
  const tiles = ease(f, 352, 376);
  const tilesOut = ease(f, E_END - 10, E_END + 4);
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Grain />
      <AbsoluteFill style={{opacity: 1 - workOut}}>
        {BUBBLES.map((b, i) => {
          const a = 2 + i * 7;
          const p = ease(f, a, a + 10);
          const x0 = 150 + rnd(i, 31) * 520, y0 = 760 + i * 120 + (rnd(i, 33) - 0.5) * 40;
          const field = FIELDS[i % 4];
          void field;
          const x = interpolate(gather, [0, 1], [x0, 540 - 150]);
          const y = interpolate(gather, [0, 1], [y0, 980 + (i % 4) * 90]);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, padding: '18px 28px', background: '#1F2B23', borderRadius: 28, borderBottomLeftRadius: 6,
              fontFamily: DISPLAY, fontWeight: 600, fontSize: 40, color: C.white, opacity: p * (1 - gather), transform: `scale(${(0.6 + p * 0.4) * (1 - gather * 0.4)}) rotate(${(rnd(i, 35) - 0.5) * 8 * (1 - gather)}deg)`,
              transformOrigin: '0 100%', whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(0,0,0,0.5)'}}>{b}</div>
          );
        })}
        {/* intake form */}
        <div style={{position: 'absolute', left: interpolate(toDraft, [0, 1], [190, 90]), top: interpolate(toDraft, [0, 1], [820, 700]), width: 700, padding: '32px 40px', boxSizing: 'border-box',
          background: C.white, borderTop: `12px solid ${C.green}`, opacity: formIn, transform: `scale(${interpolate(toDraft, [0, 1], [1, 0.62])})`, transformOrigin: '0 0', boxShadow: '0 30px 60px rgba(0,0,0,0.6)'}}>
          <Label size={24} color="#6A6556">Intake</Label>
          {FIELDS.map((fl, i) => {
            const fill = ease(f, 168 + i * 12, 180 + i * 12);
            return (
              <div key={fl.k} style={{display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingBottom: 12, borderBottom: '3px solid #D6D0BE'}}>
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#6A6556', textTransform: 'uppercase', letterSpacing: '0.1em'}}>{fl.k}</div>
                <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, color: C.ink, opacity: fill}}>{fl.v}</div>
              </div>
            );
          })}
        </div>
        {/* drafted reply with human approval */}
        <div style={{position: 'absolute', left: 200, top: 1000, width: 680, height: 520, padding: '30px 38px', boxSizing: 'border-box', background: '#EAE5D6',
          borderTop: `12px solid ${C.gold}`, opacity: toDraft, transform: `translateY(${(1 - toDraft) * 60}px)`, boxShadow: '0 30px 60px rgba(0,0,0,0.6)'}}>
          <Label size={24} color="#6A6556">Draft reply</Label>
          {[560, 600, 480, 580, 360].map((w, i) => (
            <div key={i} style={{marginTop: 30, height: 14, width: w * ease(f, 260 + i * 9, 276 + i * 9), background: '#A9A390'}} />
          ))}
          <div style={{position: 'absolute', right: 30, bottom: 30, padding: '16px 24px', background: C.gold, fontFamily: DISPLAY, fontWeight: 900, fontSize: 38, color: C.black,
            opacity: stamp, transform: `scale(${interpolate(stamp, [0, 1], [1.6, 1])}) rotate(-4deg)`}}>You approve ✓</div>
        </div>
      </AbsoluteFill>
      {/* MAIM <-> Academy: connected options, either can come first */}
      <AbsoluteFill style={{opacity: tiles * (1 - tilesOut)}}>
        {[{k: 'MAIM', s: 'Think', t: 'See the problem clearly', c: C.green, y: 760}, {k: 'MAIM Academy', s: 'Build', t: 'Make it work in practice', c: C.gold, y: 1160}].map((it, i) => (
          <div key={it.k} style={{position: 'absolute', left: SAFE.x, top: it.y, width: 800, height: 230, background: C.ink, borderLeft: `14px solid ${it.c}`, padding: '36px 44px', boxSizing: 'border-box',
            transform: `translateX(${(1 - ease(f, 352 + i * 8, 376 + i * 8)) * (i ? 80 : -80)}px)`, boxShadow: '0 24px 48px rgba(0,0,0,0.6)'}}>
            <Label size={28} color={it.c === C.gold ? C.gold : C.white}>{`${it.k} · ${it.s}`}</Label>
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 60, color: C.white, marginTop: 14, letterSpacing: '-0.02em'}}>{it.t}</div>
          </div>
        ))}
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <line x1={490} y1={1000} x2={490} y2={1150} stroke={C.white} strokeWidth={5} strokeDasharray="12 10" opacity={ease(f, 372, 390)} />
          <polygon points="490,1000 476,1024 504,1024" fill={C.white} opacity={ease(f, 372, 390)} />
          <polygon points="490,1150 476,1126 504,1126" fill={C.white} opacity={ease(f, 372, 390)} />
        </svg>
        <div style={{position: 'absolute', left: 530, top: 1050, fontFamily: MONO, fontWeight: 700, fontSize: 28, color: C.muted, letterSpacing: '0.12em', opacity: ease(f, 380, 396)}}>START WITH EITHER</div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 116 ? <Headline text="Put your expertise to work differently." start={4} size={96} perWord={2} gold={['expertise']} out={108} /> : null}
        {f >= 112 && f < 240 ? <Headline text="One messy inquiry. One clear intake." start={114} size={92} perWord={2} gold={['clear']} out={232} /> : null}
        {f >= 236 && f < 348 ? <Headline text="A drafted reply. Your judgment." start={238} size={92} perWord={2} gold={['judgment']} out={340} /> : null}
        {f >= 346 && f < E_END ? <Headline text="Think it through. Build it for real." start={348} size={92} perWord={2} gold={['real']} out={E_END - 8} /> : null}
      </div>
      {f >= E_END - 6 ? (
        <EndCard start={E_END} logo={staticFile('maim-mark.png')} eyebrow="MAIM · MAIM Academy" headline="Think clearly. Build practically." gold={['practically']}
          cta="Find your starting point" url="majoraimindset.com" urlSize={46} />
      ) : null}
    </AbsoluteFill>
  );
};
