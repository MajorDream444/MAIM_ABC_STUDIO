#!/usr/bin/env bash
# Reproducible export for one film: render -> sound -> loudness -> mux -> WhatsApp -> poster.
# Usage: scripts/export.sh <CompositionId> <sound-key A..F> <output-basename> [--skip-render]
# Requires: npm ci (fonts are pinned in package.json), ffmpeg, python3 + numpy.
# Set REMOTION_BROWSER to a Chrome Headless Shell path if Remotion should not download its own.
set -euo pipefail
cd "$(dirname "$0")/.."
COMP="$1"; KEY="$2"; NAME="$3"; SKIP="${4:-}"
OUT=out/final; RAW=out/f/$COMP.raw.mp4; mkdir -p "$OUT" out/f audio/build
BROWSER=${REMOTION_BROWSER:+--browser-executable=$REMOTION_BROWSER}
if [ "$SKIP" != "--skip-render" ]; then
  npx remotion render src/index.ts "$COMP" "$RAW" $BROWSER --gl=swangle --codec=h264 --crf=14 --concurrency=2
fi
python3 audio/sound.py "$KEY" "audio/build/$KEY.wav"
# two-pass loudness normalisation: I -16 LUFS, true peak -1.5 dBTP
M=$(ffmpeg -nostats -i "audio/build/$KEY.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -v error -y -i "audio/build/$KEY.wav" -af "loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:$M" -ar 48000 "audio/build/${KEY}_norm.wav"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RAW")
ffmpeg -v error -y -i "$RAW" -i "audio/build/${KEY}_norm.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 192k -movflags +faststart -t "$DUR" "$OUT/${NAME}_9x16.mp4"
ffmpeg -v error -y -i "$OUT/${NAME}_9x16.mp4" -vf scale=720:1280:flags=lanczos -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -af volume=-1.2dB -c:a aac -b:a 96k -movflags +faststart "$OUT/${NAME}_9x16_whatsapp.mp4"
ffmpeg -v error -y -sseof -0.05 -i "$OUT/${NAME}_9x16.mp4" -frames:v 1 -q:v 2 "$OUT/${NAME}_poster.jpg"
echo "exported $NAME"
