"""Measures how long the settled end card (logo, headline, CTA panel, URL, note) is held unchanged in an encoded export.
Decodes every frame of the last 8 s at full frame rate, compares the end-card region with the final frame."""
import subprocess, sys, numpy as np, json
path = sys.argv[1]
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',path]).decode())
W,H = 270,480
raw = subprocess.check_output(['ffmpeg','-v','error','-sseof','-8','-i',path,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','gray','-'])
fr = np.frombuffer(raw, np.uint8).reshape(-1,H,W).astype(np.float32)
region = sys.argv[2] if len(sys.argv) > 2 else 'card'
# 'card' = logo..tri-bar; 'panel' = the opaque gold CTA panel + URL + note only (use when a moving scene shows through a dimmed end card)
reg = fr[:, int(H*0.13):int(H*0.83), int(W*0.12):int(W*0.88)] if region == 'card' else fr[:, int(H*0.61):int(H*0.80), int(W*0.15):int(W*0.85)]
last = reg[-1]
d = np.abs(reg - last).mean(axis=(1,2))
# settled = first frame after which every later frame differs from the final by < 1.0 grey level
idx = len(d) - 1
while idx > 0 and d[idx-1] < 1.0: idx -= 1
hold = (len(d) - idx) / 30
print(json.dumps({'file': path.split('/')[-1], 'duration_s': round(dur,2), 'settled_at_s': round(dur - hold,2), 'cta_hold_s': round(hold,2), 'region': region}))
