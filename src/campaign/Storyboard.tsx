import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CameraPose, PoolScene} from '../PoolWorld';
import {C, DISPLAY, MONO, SAFE, useFonts, TriBar, Label, Grain, rnd} from './kit';

// Storyboard key frames for films A-E (3 beats each). Static design frames, not final animation.
// Frame index k -> film Math.floor(k/3), beat k%3.

const H = ({t, gold = [] as string[], size = 88}: {t: string; gold?: string[]; size?: number}) => (
  <div style={{position: 'absolute', left: SAFE.x, top: 220, width: SAFE.w, fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.025em', color: C.white}}>
    {t.split(' ').map((w, i) => <span key={i} style={{color: gold.includes(w.toLowerCase().replace(/[^a-z]/g, '')) ? C.gold : undefined}}>{w} </span>)}
  </div>
);
const Cta = ({t, url}: {t: string; url: string}) => (
  <div style={{position: 'absolute', left: 150, top: 1240, width: 780}}>
    <div style={{background: C.gold, padding: '32px 20px', textAlign: 'center'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: C.black}}>{t}</div>
      <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, color: C.black, marginTop: 12}}>{url}</div>
    </div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 40}}><TriBar w={240} /></div>
  </div>
);
const Tag = ({x, y, t, w = 300, hi = false, rot = 0, o = 1}: {x: number; y: number; t: string; w?: number; hi?: boolean; rot?: number; o?: number}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - 60, width: w, height: 120, background: hi ? C.white : '#E3DECF', opacity: o,
    borderTop: `10px solid ${hi ? C.gold : '#C2BCAA'}`, transform: `rotate(${rot}deg)`, boxShadow: '0 18px 36px rgba(0,0,0,0.55)', padding: '16px 20px', boxSizing: 'border-box',
    fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, color: C.ink, lineHeight: 1.05}}>{t}</div>
);
const Line = ({x1, y1, x2, y2, c = C.gold, w = 4, o = 1}: {x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; o?: number}) => (
  <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} opacity={o} /></svg>
);
const Msg = ({t}: {t: string}) => (
  <div style={{position: 'absolute', left: SAFE.x, top: 700, width: SAFE.w, fontFamily: DISPLAY, fontWeight: 900, fontSize: 80, lineHeight: 1.05, color: C.white, letterSpacing: '-0.02em'}}>{t}</div>
);

const POOL: CameraPose[] = [
  {frame: 0, angle: 0.0, radius: 9.5, height: 7.5, look: [0, -0.8, -0.6]},
  {frame: 1, angle: 0.9, radius: 6.2, height: 3.2, look: [1.5, -0.6, 0]},
  {frame: 2, angle: -0.5, radius: 7.0, height: 2.4, look: [-2.2, -1.2, 0]},
];

const Pool = ({beat}: {beat: number}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping}} camera={{fov: 50, near: 0.1, far: 60, position: [0, 8, 9]}}>
        <PoolScene poses={POOL} lineUntilS={0} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'linear-gradient(rgba(5,5,5,0.85) 0%, rgba(5,5,5,0) 32%, rgba(5,5,5,0) 70%, rgba(5,5,5,0.8) 100%)'}} />
      {beat === 0 && <H t="You don't have to start in the same place." gold={['start']} />}
      {beat === 1 && <><H t="Awareness by the steps. Belief by the ladder." size={76} gold={['awareness', 'belief']} /><Label style={{position: 'absolute', left: SAFE.x, top: 1520}} color={C.white}>Context · the deep-end light</Label></>}
      {beat === 2 && <><H t="Different ways in. One evolving mindset." gold={['one']} /><Cta t="Explore the MAIM mindset" url="majoraimindset.com" /></>}
    </AbsoluteFill>
  );
};

const Awareness = ({beat}: {beat: number}) => {
  const tasks = Array.from({length: 11}, (_, i) => ({x: 200 + rnd(i, 2) * 680, y: 760 + rnd(i, 4) * 640, r: (rnd(i, 6) - 0.5) * 30}));
  const rep = [1, 4, 6, 9];
  return (
    <AbsoluteFill>
      {beat === 0 && <><H t="What keeps repeating in your business?" gold={['repeating']} />{tasks.map((t, i) => <Tag key={i} x={t.x} y={t.y} rot={t.r} w={240} t={['Reply', 'Invoice', 'Chase', 'Quote', 'Chase', 'Book', 'Chase', 'Post', 'File', 'Chase', 'Call'][i]} />)}</>}
      {beat === 1 && <>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(5,5,5,0) 30%, rgba(216,175,85,0.18) 50%, rgba(5,5,5,0) 70%)'}} />
        {rep.map((i) => <Line key={i} x1={tasks[i].x} y1={tasks[i].y} x2={540} y2={1560} />)}
        {tasks.map((t, i) => <Tag key={i} x={t.x} y={t.y} rot={t.r} w={240} hi={rep.includes(i)} o={rep.includes(i) ? 1 : 0.25} t={rep.includes(i) ? 'Chase payment' : '·'} />)}
        <div style={{position: 'absolute', left: 500, top: 1520, width: 80, height: 80, borderRadius: '50%', background: C.gold}} />
        <Label style={{position: 'absolute', left: SAFE.x, top: 250}} color={C.muted}>No words yet · the pattern shows first</Label>
      </>}
      {beat === 2 && <><Msg t="Before you change the system, notice the pattern." /><Cta t="Start with Awareness" url="majoraimindset.com" /></>}
    </AbsoluteFill>
  );
};

const Belief = ({beat}: {beat: number}) => (
  <AbsoluteFill>
    {beat === 0 && <><H t="What have you already decided you can't do?" gold={['decided']} />
      <div style={{position: 'absolute', left: 180, top: 760, width: 720, height: 780, background: 'linear-gradient(#2A2925, #171613)', boxShadow: '0 40px 80px rgba(0,0,0,0.7)'}} /></>}
    {beat === 1 && <>
      <div style={{position: 'absolute', left: 120, top: 640, width: 470, height: 900, background: 'linear-gradient(#2E2D28, #151411)', transform: 'perspective(1400px) rotateY(28deg)', boxShadow: '30px 40px 80px rgba(0,0,0,0.8)'}} />
      <div style={{position: 'absolute', left: 560, top: 700, width: 420, height: 860, background: 'linear-gradient(#26251F, #100F0D)', transform: 'perspective(1400px) rotateY(28deg)'}} />
      <div style={{position: 'absolute', left: 520, top: 690, width: 70, height: 860, background: 'linear-gradient(rgba(216,175,85,0.9), rgba(216,175,85,0.2))', filter: 'blur(14px)'}} />
      <Label style={{position: 'absolute', left: SAFE.x, top: 250}} color={C.muted}>Camera moves · the wall was two panels with a way through</Label>
    </>}
    {beat === 2 && <><Msg t="What you believe shapes what you try." /><Cta t="Explore Belief with MAIM" url="majoraimindset.com" /></>}
  </AbsoluteFill>
);

const Context = ({beat}: {beat: number}) => (
  <AbsoluteFill>
    {beat === 0 && <><H t="You might be solving the wrong problem." gold={['wrong']} />
      <div style={{position: 'absolute', left: 140, top: 820, width: 800, height: 520, background: C.white, borderTop: `16px solid ${C.gold}`, padding: 50, boxSizing: 'border-box'}}>
        <Label color="#6A6556" size={28}>Stalled · 9 days</Label>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, color: C.ink, marginTop: 20, lineHeight: 1}}>Finish the proposal</div>
      </div></>}
    {beat === 1 && <>
      <Line x1={540} y1={1080} x2={260} y2={760} /><Line x1={540} y1={1080} x2={820} y2={800} /><Line x1={540} y1={1080} x2={540} y2={1430} />
      <Tag x={540} y={1080} w={360} hi t="Finish the proposal" />
      <Tag x={260} y={760} w={300} t="Unclear request" />
      <Tag x={820} y={800} w={300} t="Missing price list" />
      <Tag x={540} y={1430} w={340} t="Waiting on a handoff" />
      <Label style={{position: 'absolute', left: SAFE.x, top: 250}} color={C.muted}>Pull back · three causes, no tiny labels</Label>
    </>}
    {beat === 2 && <><Msg t="The picture changes when you see what surrounds it." /><Cta t="See the bigger picture" url="majoraimindset.com" /></>}
  </AbsoluteFill>
);

const Prove = ({beat}: {beat: number}) => (
  <AbsoluteFill>
    {beat === 0 && <><H t="Put your expertise to work differently." gold={['expertise']} />
      {['hi can u do', 'price for 3 ppl?', 'next week maybe', 'saw ur post', 'is it online?'].map((t, i) => (
        <div key={i} style={{position: 'absolute', left: 140 + rnd(i, 8) * 420, top: 780 + i * 140, padding: '18px 26px', background: '#1E2A22', color: C.white, fontFamily: DISPLAY, fontSize: 38, transform: `rotate(${(rnd(i, 9) - 0.5) * 12}deg)`}}>{t}</div>
      ))}</>}
    {beat === 1 && <>
      <div style={{position: 'absolute', left: SAFE.x, top: 720, width: 420, height: 560, background: C.white, padding: 30, boxSizing: 'border-box'}}>
        <Label color="#6A6556" size={22}>Intake</Label>
        {['Group size: 3', 'Format: online', 'Timing: next week'].map((t) => <div key={t} style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, color: C.ink, marginTop: 26, borderBottom: '2px solid #CFC9B7', paddingBottom: 10}}>{t}</div>)}
      </div>
      <div style={{position: 'absolute', left: 570, top: 820, width: 420, height: 560, background: '#EAE5D6', padding: 30, boxSizing: 'border-box'}}>
        <Label color="#6A6556" size={22}>Follow-up draft</Label>
        {[300, 340, 260, 320, 200].map((w, i) => <div key={i} style={{height: 12, width: w, background: '#B9B3A1', marginTop: 26}} />)}
        <div style={{position: 'absolute', right: 24, bottom: 24, background: C.gold, padding: '10px 16px', fontFamily: MONO, fontWeight: 700, fontSize: 22, color: C.black}}>HUMAN REVIEW ✓</div>
      </div>
      <Label style={{position: 'absolute', left: SAFE.x, top: 250}} color={C.muted}>Illustrative artifact · no client data, no results claimed</Label>
    </>}
    {beat === 2 && <>
      {[{k: 'MAIM · Think', t: 'Develops the mind', c: C.green}, {k: 'Academy · Build', t: 'Develops the practice', c: C.gold}, {k: 'Spark Lab · Prove', t: 'Turns practice to proof', c: C.blue}].map((it, i) => (
        <div key={it.k} style={{position: 'absolute', left: SAFE.x, top: 300 + i * 260, width: 800, height: 200, background: C.ink, borderLeft: `14px solid ${it.c}`, padding: '34px 40px', boxSizing: 'border-box'}}>
          <Label size={26} color={it.c === C.gold ? C.gold : C.white}>{it.k}</Label>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 54, color: C.white, marginTop: 10}}>{it.t}</div>
        </div>
      ))}
      <Cta t="Find your starting point" url="majoraimindset.com" />
    </>}
  </AbsoluteFill>
);

export const Storyboard = () => {
  useFonts();
  const k = useCurrentFrame();
  const film = Math.floor(k / 3), beat = k % 3;
  return (
    <AbsoluteFill style={{background: C.black, overflow: 'hidden'}}>
      {film !== 0 && <Grain />}
      {film === 0 && <Pool beat={beat} />}
      {film === 1 && <Awareness beat={beat} />}
      {film === 2 && <Belief beat={beat} />}
      {film === 3 && <Context beat={beat} />}
      {film === 4 && <Prove beat={beat} />}
    </AbsoluteFill>
  );
};
