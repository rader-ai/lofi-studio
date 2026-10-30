#!/usr/bin/env python3
"""Turn a timestamped screen recording into a looping WebP: thin it to a steady frame rate while
keeping true timing, optionally double it with sharp pixel edges and dress it in the pixel phone
frame, and close the loop with a short fade through the app's ink colour."""
import argparse, json, os, shutil, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--gap', type=int, default=83, help='minimum milliseconds between frames')
ap.add_argument('--scale', type=int, default=1)
ap.add_argument('--bezel'); ap.add_argument('--at', default='+0+0')
ap.add_argument('--q', type=int, default=78)
ap.add_argument('--still', type=float, default=.35, help='where in the recording to take the still from (0 to 1)')
a = ap.parse_args()
FADE_IN, FADE_OUT, INK = 4, 6, '#07040f'

idx = json.load(open(os.path.join(a.src, 'index.json')))
kept, last = [], -1e9
for f in idx:
    if (f['t'] - last) * 1000 >= a.gap:
        kept.append(f); last = f['t']
tmp = a.out + '.tmp'
shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)

def command(i, f):
    dark = 0
    if i < FADE_IN: dark = round(100 * (1 - (i + 1) / (FADE_IN + 1)))
    if i >= len(kept) - FADE_OUT: dark = round(100 * (i - (len(kept) - FADE_OUT) + 1) / (FADE_OUT + 1))
    frame = [os.path.join(a.src, f['file'])]
    if dark: frame += ['-fill', INK, '-colorize', f'{dark}%']
    if a.scale != 1: frame += ['-filter', 'point', '-resize', f'{a.scale * 100}%']
    if a.bezel: return ['magick', a.bezel, '(', *frame, ')', '-gravity', 'NorthWest', '-geometry', a.at, '-compose', 'over', '-composite', os.path.join(tmp, f'{i:04d}.png')]
    return ['magick', *frame, os.path.join(tmp, f'{i:04d}.png')]

running = []
for i, f in enumerate(kept):
    running.append(subprocess.Popen(command(i, f)))
    if len(running) >= 8:
        for p in running: p.wait()
        running = []
for p in running: p.wait()

# the fade-in goes at the end of the file, so the first frame people see is a bright one
lines = ['-loop 0']
for i in [*range(FADE_IN, len(kept)), *range(FADE_IN)]:
    f = kept[i]
    nxt = kept[i + 1]['t'] if i + 1 < len(kept) else f['t'] + a.gap / 1000
    lines.append(f"-lossy -q {a.q} -m 6 -sharp_yuv -d {max(20, round((nxt - f['t']) * 1000))} {os.path.join(tmp, f'{i:04d}.png')}")
lines.append(f'-o {a.out}')
args = a.out + '.args'
open(args, 'w').write('\n'.join(lines) + '\n')
subprocess.run(['img2webp', args], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
os.remove(args)
still = a.out.replace('.webp', '-still.webp')
subprocess.run(['magick', os.path.join(tmp, f'{int(len(kept) * a.still):04d}.png'), '-quality', '90', still], check=True)
shutil.rmtree(tmp)
print(f'{os.path.basename(a.out)}: {len(kept)} frames over {kept[-1]["t"] - kept[0]["t"]:.1f}s, {os.path.getsize(a.out) / 1e6:.2f} MB')
