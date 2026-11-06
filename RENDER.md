# MAIM motion campaign: render instructions

Everything visible is composited in code. Animation is frame-driven with seeded randomness, so the same inputs give the same frames.

## 1. Install
1. Install Node 22 and run `npm ci`. This also installs the fonts, which are pinned in `package.json` and the lockfile:
   - `@fontsource/archivo` 5.3.0
   - `@fontsource/jetbrains-mono` 5.3.0
2. Install ffmpeg (tested with 7.x).
3. Install Python 3.11+ with `numpy` and `scipy`. They are only needed for the sound beds.
4. Optional: if Remotion should use an existing Chrome Headless Shell instead of downloading one, run `export REMOTION_BROWSER=/path/to/chrome-headless-shell`.

## 2. Export one film
Run `scripts/export.sh <CompositionId> <SoundKey> <OutputName>`. The script:
1. Renders the composition.
2. Generates the sound bed.
3. Normalises loudness in two passes (I −16 LUFS, TP −1.5 dBTP).
4. Muxes the master: H.264 high, CRF 19, yuv420p, faststart, AAC 192k.
5. Makes the WhatsApp version: 720×1280, CRF 27, AAC 96k, −1.2 dB.
6. Saves the poster frame (the last frame).

| Film | CompositionId | SoundKey | OutputName |
|---|---|---|---|
| A Thinking Pool | A-ThinkingPool | A | MAIM_A_thinking-pool |
| B Awareness | B-Awareness | B | MAIM_B_awareness |
| C Belief | C-Belief | C | MAIM_C_belief |
| D Context | D-Context | D | MAIM_D_context |
| E Think. Build. | E-ThinkBuild | E | MAIM_E_think-build |
| F Cohort, dated | F-Cohort | F | MAIM_F_founding-cohort_dated |
| F Cohort, evergreen | F-Cohort-Evergreen | F | MAIM_F_founding-cohort_evergreen |

Film A uses WebGL (three.js). In a headless Linux container it needs `--gl=swangle`; the export script passes this flag. A renders much more slowly than the DOM-only films B–F.

## 3. Check the export
`python3 scripts/qa_hold.py out/final/<name>_9x16.mp4` decodes every frame of the last 8 seconds and reports how long the settled end card is held. The target is at least 4 seconds.

## 4. Where to edit
- **Brand tokens, end card, typography:** `src/campaign/kit.tsx`.
- **Each film:** `src/campaign/Film*.tsx`. Each file exports its duration and end-card frame.
- **Pool scene:** `src/PoolWorld.tsx`. The optional `entries` and `hooks` props were added for Film A. With neither prop set, the scene renders exactly as the approved Thinking Pool did.
- **Sound:** `audio/sound.py`, one function per film, keyed to frame numbers.
