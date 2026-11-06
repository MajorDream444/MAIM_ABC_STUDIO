import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {C, DISPLAY, MONO, SAFE, clamp, ease, rnd, useFonts, Headline, Label, Grain, EndCard} from './kit';
export const F_DURATION = 640;
export const F_END = 478;

// F. FOUNDING COHORT INVITATION — 21.3 s @ 30 fps (640 frames). End card settled from 506, held 4.5 s.
// Insight: everything comes back to the owner. Transformation: one pile -> one organised process with human review.
export type FilmFProps = {variant: 'dated' | 'evergreen'};

const TASKS = [
  'Client email', 'Quote request', 'Invoice?', 'Booking change', "Where's the file?", 'Follow-up',
  'Proposal', 'Price question', 'Supplier call', 'Team question', 'Refund?', 'Approval needed',
  'Social post', 'New client inquiry',
];
const CHOSEN = TASKS.length - 1;
const NODE = {x: 540, y: 1130};
const ARRIVE = (i: number) => 2 + i * 8; // first card moves on frame 2
export const LANDINGS = TASKS.map((_, i) => ARRIVE(i) + 16);

const Card = ({i}: {i: number}) => {
  const f = useCurrentFrame();
  const a = ARRIVE(i);
  const p = ease(f, a, a + 16);
  // start offscreen around a ring, land on a loose pile around the node
  const ang = (0.08 + rnd(i, 3) * 0.84) * Math.PI; // enter from the sides and below only: never across the headline
  const sx = NODE.x + Math.cos(ang) * 1100, sy = NODE.y + Math.sin(ang) * 1300;
  const ex = NODE.x + (rnd(i, 5) - 0.5) * 380, ey = NODE.y + (rnd(i, 7) - 0.5) * 300 - i * 5;
  const rot0 = (rnd(i, 9) - 0.5) * 70, rot1 = (rnd(i, 11) - 0.5) * 26;
  // pressure: pile shudders 150-205
  const shake = f > 140 && f < 195 ? Math.sin(f * 2.3 + i) * 3 * ease(f, 140, 155) * ease(f, 182, 195, 1, 0) : 0;
  // phase 3: pile dims and sinks; chosen card lifts out to the first station
  const isChosen = i === CHOSEN;
  const sink = ease(f, 196, 226);
  const lift = isChosen ? ease(f, 198, 230) : 0;
  let x = interpolate(p, [0, 1], [sx, ex]) + shake;
  let y = interpolate(p, [0, 1], [sy, ey]) + (isChosen ? 0 : sink * 520);
  let s = interpolate(p, [0, 1], [1.7, 1]) * (isChosen ? 1 : 1 - sink * 0.3);
  let r = interpolate(p, [0, 1], [rot0, rot1]);
  let op = isChosen ? 1 : 1 - sink;
  if (isChosen) {
    // 1) lifts out of the pile and is held up, 2) shrinks into a token at the top of the process spine,
    // 3) travels down the spine past each station (never over the station text)
    x = interpolate(lift, [0, 1], [x, 540]);
    y = interpolate(lift, [0, 1], [y, 1010]);
    s = interpolate(lift, [0, 1], [s, 1.15]);
    r = interpolate(lift, [0, 1], [r, 0]);
    const toSpine = ease(f, 232, 252);
    x = interpolate(toSpine, [0, 1], [x, 199]);
    y = interpolate(toSpine, [0, 1], [y, 760]);
    s = interpolate(toSpine, [0, 1], [s, 0.2]);
    if (f >= 252) y = interpolate(f, [252, 286, 320, 350], [760, 1000, 1240, 1480], clamp);
    op = 1 - ease(f, 380, 392);
  }
  if (f < a) return null;
  const shadow = 10 + (1 - p) * 40;
  return (
    <div style={{position: 'absolute', left: x - 160, top: y - 98, width: 320, height: 196, opacity: op,
      transform: `rotate(${r}deg) scale(${s})`, background: isChosen ? C.white : '#EAE5D6',
      boxShadow: `0 ${shadow}px ${shadow * 1.6}px rgba(0,0,0,${0.55 - p * 0.15})`, padding: '22px 24px', boxSizing: 'border-box',
      borderTop: `10px solid ${isChosen ? C.gold : ['#C9C3B1', '#BDB6A3', '#D2CCBA'][i % 3]}`, zIndex: isChosen ? 50 : i}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 19, letterSpacing: '0.14em', color: '#6A6556', textTransform: 'uppercase'}}>{isChosen ? 'Chosen' : 'Incoming'}</div>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, lineHeight: 1.05, color: C.ink, marginTop: 12}}>{TASKS[i]}</div>
      <div style={{marginTop: 16, height: 6, width: 200, background: '#CFC9B7'}} />
      <div style={{marginTop: 10, height: 6, width: 140, background: '#CFC9B7'}} />
    </div>
  );
};

const Node = () => {
  const f = useCurrentFrame();
  const appear = ease(f, 0, 10);
  const strain = f > 115 && f < 196 ? 1 + Math.sin(f * 1.7) * 0.03 * ease(f, 115, 145) : 1;
  const gone = ease(f, 196, 220);
  const size = 170;
  return (
    <div style={{position: 'absolute', left: NODE.x - size / 2, top: NODE.y - size / 2, width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, #F0D58C, ${C.gold} 45%, #8C6A22 100%)`, opacity: appear * (1 - gone),
      transform: `scale(${strain * (0.6 + appear * 0.4)})`, boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 80px rgba(216,175,85,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.18em', color: C.black}}>YOU</div>
    </div>
  );
};

const STATIONS = [
  {k: 'Intake', t: 'Inquiry captured', y: 760},
  {k: 'Draft', t: 'AI drafts a reply', y: 1000},
  {k: 'Review', t: 'You review and approve', y: 1240, human: true},
  {k: 'Send', t: 'Reply sent', y: 1480},
];

const Flow = () => {
  const f = useCurrentFrame();
  const out = ease(f, 392, 406);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      {/* spine */}
      <div style={{position: 'absolute', left: 196, top: 760, width: 6, height: 720 * ease(f, 240, 350, 0, 1, (t) => t), background: `linear-gradient(${C.green}, ${C.gold}, ${C.blue})`}} />
      {STATIONS.map((s, i) => {
        const a = 234 + i * 12;
        const p = ease(f, a, a + 14);
        const reached = [252, 286, 320, 350][i];
        const lit = ease(f, reached, reached + 8);
        return (
          <div key={s.k} style={{position: 'absolute', left: SAFE.x + 60, top: s.y - 70, width: SAFE.w - 60, height: 140, opacity: p, transform: `translateX(${(1 - p) * 60}px)`}}>
            <div style={{position: 'absolute', left: 0, top: 46, width: 48, height: 48, background: s.human ? C.gold : lit > 0.5 ? C.white : C.ink,
              border: `3px solid ${s.human ? C.gold : C.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: lit ? `0 0 ${30 * lit}px rgba(216,175,85,${0.6 * lit})` : 'none'}}>
              {s.human ? (
                <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="10" r="6" fill={C.black} /><path d="M4 28c1-7 5-10 11-10s10 3 11 10" fill={C.black} /></svg>
              ) : null}
            </div>
            <div style={{position: 'absolute', left: 90, top: 10}}>
              <Label size={26} color={s.human ? C.gold : C.muted}>{`0${i + 1} · ${s.k}`}</Label>
              <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 60, lineHeight: 1.05, color: s.human ? C.gold : C.white, marginTop: 6, width: 720}}>{s.t}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Support = () => {
  const f = useCurrentFrame();
  const items = [
    {t: 'Live teaching', c: C.green},
    {t: 'Practical assignments', c: C.gold},
    {t: 'Guided support', c: C.blue},
  ];
  const out = ease(f, 468, 480);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      {items.map((it, i) => {
        const a = 406 + i * 8;
        const p = ease(f, a, a + 14);
        return (
          <div key={it.t} style={{position: 'absolute', left: SAFE.x, top: 860 + i * 190, width: 800, height: 150, background: C.ink,
            borderLeft: `14px solid ${it.c}`, display: 'flex', alignItems: 'center', paddingLeft: 44, boxSizing: 'border-box',
            opacity: p, transform: `translateY(${(1 - p) * 50}px)`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 58, color: C.white, letterSpacing: '-0.02em'}}>{it.t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const End = ({variant}: FilmFProps) => variant === 'dated' ? (
  <EndCard start={F_END} logo={staticFile('academy-crest.png')} eyebrow="MAIM Academy · Founding Cohort" headline="Bring one challenge. Build one system." gold={['system']}
    fact="Starts 18 Nov 2026 · 20 places" cta="Request your place — free" url="academy.majoraimindset.com/reserve" urlSize={38} note="Payment invitation follows approval." />
) : (
  <EndCard start={F_END} logo={staticFile('academy-crest.png')} eyebrow="MAIM Academy" headline="Bring one challenge. Build one system." gold={['system']}
    cta="Explore MAIM Academy" url="academy.majoraimindset.com" urlSize={44} />
);

export const FilmF = ({variant}: FilmFProps) => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      <Grain />
      {f < 222 ? <Node /> : null}
      {f < 394 ? TASKS.map((_, i) => <Card key={i} i={i} />) : null}
      {f >= 230 && f < 408 ? <Flow /> : null}
      {f >= 402 && f < 482 ? <Support /> : null}
      {f >= F_END - 6 ? <End variant={variant} /> : null}
      {/* headline track */}
      <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w}}>
        {f < 146 ? <Headline text="Does everything in your business come back to you?" start={0} size={92} perWord={2} gold={['you']} out={138} /> : null}
        {f >= 144 && f < 204 ? <Headline text="Every request lands on one desk." start={146} size={92} perWord={2} out={196} /> : null}
        {f >= 200 && f < 290 ? <Headline text="Bring one real business challenge." start={202} size={92} perWord={2} gold={['one']} out={282} /> : null}
        {f >= 286 && f < 402 ? <Headline text="Build a practical AI-supported system." start={288} size={92} perWord={2} gold={['practical']} out={392} /> : null}
        {f >= 398 && f < 480 ? (
          <>
            <Label size={26} style={{opacity: ease(f, 400, 410, 0, 1) * (1 - ease(f, 468, 478))}}>MAIM Academy · Founding Cohort</Label>
            <div style={{marginTop: 24}}><Headline text="Learn it live. Build it for real." start={402} size={92} perWord={2} gold={['real']} out={468} /></div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
