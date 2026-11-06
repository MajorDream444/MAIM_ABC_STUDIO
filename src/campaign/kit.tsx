import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, Easing, useCurrentFrame} from 'remotion';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/900.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

// MAIM 00 Brand System tokens (C1: Academy adopts MAIM 00 names)
export const C = {
  black: '#050505',
  ink: '#111110',
  white: '#F7F4EA',
  gold: '#D8AF55',
  goldDeep: '#D4AF37',
  green: '#1F7A3A',
  blue: '#006BB6',
  muted: '#A9A493',
};
export const DISPLAY = "'Archivo', sans-serif"; // Academy headlines: Archivo 900, sentence case (C6)
export const MONO = "'JetBrains Mono', monospace";

// Safe area per brief: 90 sides, 180 top, 320 bottom
export const SAFE = {x: 90, top: 180, bottom: 320, w: 1080 - 180};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});

// deterministic pseudo-random
export const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('900 80px Archivo'),
      document.fonts.load('700 40px Archivo'),
      document.fonts.load('600 40px Archivo'),
      document.fonts.load('400 40px Archivo'),
      document.fonts.load('500 30px "JetBrains Mono"'),
      document.fonts.load('700 30px "JetBrains Mono"'),
    ]).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
};

export const TriBar = ({w = 240, h = 8, p = 1}: {w?: number; h?: number; p?: number}) => (
  <div style={{display: 'flex', width: w * p, height: h, overflow: 'hidden'}}>
    <div style={{flex: 1, background: C.green, minWidth: w / 3}} />
    <div style={{flex: 1, background: C.gold, minWidth: w / 3}} />
    <div style={{flex: 1, background: C.blue, minWidth: w / 3}} />
  </div>
);

// Word-by-word headline reveal; words rise and unblur.
export const Headline = ({text, start, size = 92, color = C.white, gold = [] as string[], perWord = 3, out, align = 'left' as 'left' | 'center', lh = 1.04}: {
  text: string; start: number; size?: number; color?: string; gold?: string[]; perWord?: number; out?: number; align?: 'left' | 'center'; lh?: number;
}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const o = out === undefined ? 1 : ease(f, out, out + 8, 1, 0);
  const oy = out === undefined ? 0 : ease(f, out, out + 8, 0, -30);
  return (
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: lh, letterSpacing: '-0.025em', color, textAlign: align, opacity: o, transform: `translateY(${oy}px)`}}>
      {words.map((w, i) => {
        const s = start + i * perWord;
        const p = ease(f, s, s + 10);
        const isGold = gold.some((g) => w.toLowerCase().replace(/[^a-z]/g, '') === g);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: p, transform: `translateY(${(1 - p) * 34}px)`, filter: `blur(${(1 - p) * 6}px)`, color: isGold ? C.gold : undefined}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Label = ({children, color = C.gold, size = 26, style}: {children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: '0.16em', textTransform: 'uppercase', color, ...style}}>{children}</div>
);

export const Grain = () => (
  <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 55%, rgba(216,175,85,0.07) 0%, rgba(5,5,5,0) 55%), radial-gradient(140% 90% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none'}} />
);

// Shared ending used by every film: logo, eyebrow, headline, optional fact line, gold CTA panel, note, tri-bar.
// Everything is settled by start + END_SETTLE frames; each film holds the settled card for >= 120 frames (4 s).
export const END_SETTLE = 28;
export const EndCard = ({start, logo, eyebrow, headline, gold = [], fact, cta, url, note, urlSize = 40}: {
  start: number; logo: string; eyebrow: string; headline: string; gold?: string[]; fact?: string; cta: string; url: string; note?: string; urlSize?: number;
}) => {
  const f = useCurrentFrame();
  const a = start;
  const lg = ease(f, a, a + 16);
  const p = ease(f, a + 2, a + 12);
  const box = ease(f, a + 12, a + 24);
  return (
    <AbsoluteFill style={{opacity: ease(f, a - 4, a + 4)}}>
      <img src={logo} style={{position: 'absolute', left: 540 - 160, top: 260, width: 320, height: 320, opacity: lg, transform: `scale(${0.9 + lg * 0.1})`}} />
      <div style={{position: 'absolute', left: SAFE.x, top: 650, width: SAFE.w, textAlign: 'center'}}>
        <Label size={26} style={{opacity: p}}>{eyebrow}</Label>
        <div style={{marginTop: 26}}>
          <Headline text={headline} start={a + 2} size={86} align="center" perWord={1} gold={gold} />
        </div>
        {fact ? <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 42, color: C.white, marginTop: 30, opacity: box}}>{fact}</div> : null}
      </div>
      <div style={{position: 'absolute', left: 150, top: fact ? 1230 : 1190, width: 780, opacity: box, transform: `translateY(${(1 - box) * 30}px)`}}>
        <div style={{background: C.gold, padding: '32px 20px', textAlign: 'center'}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: C.black, letterSpacing: '-0.02em'}}>{cta}</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: urlSize, color: C.black, marginTop: 14}}>{url}</div>
        </div>
        {note ? <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 36, color: C.white, opacity: 0.82, textAlign: 'center', marginTop: 26}}>{note}</div> : null}
      </div>
      <div style={{position: 'absolute', left: 540 - 120, top: 1580}}><TriBar w={240} p={box} /></div>
    </AbsoluteFill>
  );
};

export const SafeGuides = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: SAFE.x, right: SAFE.x, top: SAFE.top, bottom: SAFE.bottom, outline: '3px dashed rgba(255,0,80,0.7)'}} />
  </AbsoluteFill>
);
