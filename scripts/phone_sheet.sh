#!/usr/bin/env bash
# Phone-size readability sheet: chosen frames scaled to ~414 px wide (a typical phone width in CSS px)
# with the approximate platform UI zones (top bar, right action column, bottom caption) shaded.
set -euo pipefail
cd "$(dirname "$0")/.."
OV="drawbox=x=0:y=0:w=1080:h=150:color=white@0.18:t=fill,drawbox=x=960:y=1000:w=110:h=620:color=white@0.22:t=fill,drawbox=x=0:y=1620:w=1080:h=300:color=white@0.18:t=fill,scale=414:736:flags=area"
mkdir -p out/qa2/phone; rm -f out/qa2/phone/*.png; i=0
while read -r name t; do
  i=$((i+1)); ffmpeg -nostdin -v error -y -ss "$t" -i "out/final/${name}_9x16.mp4" -frames:v 1 -vf "$OV" "out/qa2/phone/$(printf %02d $i).png"
done
