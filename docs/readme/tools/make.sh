#!/bin/bash
# Rebuilds every picture in docs/readme from the running app, so the README can't drift from
# what the studio really looks like. Needs Node, Google Chrome, ImageMagick and img2webp.
# Nothing plays out loud: the browser runs muted.
set -e
cd "$(dirname "$0")"
OUT=$(cd ..; pwd); ROOT=$(cd ../../..; pwd)
[ -d node_modules ] || npm i --silent
python3 -m http.server 8765 --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!; trap 'kill $SERVER 2>/dev/null' EXIT; sleep 1

node fft.mjs        # what the analyser hears while each vibe plays
node scenes.mjs     # a seamless loop of each world
node hero.mjs       # the title screen
node demo.mjs phone
node demo.mjs desktop
node stills.mjs "$OUT"   # plates, buttons and album covers

for s in castle office cafe garden forest lake park beach; do
  img2webp -loop 0 -lossless -m 6 -min_size -d 60 .frames/$s/*.png -o "$OUT/world-$s.webp" 2>/dev/null
  magick .frames/$s/0020.png -define webp:lossless=true "$OUT/world-$s-still.webp"
done
img2webp -loop 0 -lossless -m 6 -min_size -d 60 .frames/hero/*.png -o "$OUT/hero.webp" 2>/dev/null
magick .frames/hero/0020.png -define webp:lossless=true "$OUT/hero-still.webp"

# the pixel phone: ink body, purple edge, stepped corners, a speaker slit
W=864; H=1524
magick -size ${W}x${H} xc:none -fill '#5b4a9e' \
  -draw "rectangle 24,0 $((W-25)),$((H-1))" -draw "rectangle 12,12 $((W-13)),$((H-13))" -draw "rectangle 0,24 $((W-1)),$((H-25))" \
  -fill '#07040f' -draw "rectangle 30,6 $((W-31)),$((H-7))" -draw "rectangle 18,18 $((W-19)),$((H-19))" -draw "rectangle 6,30 $((W-7)),$((H-31))" \
  -fill '#2a2058' -draw "rectangle $((W/2-44)),20 $((W/2+43)),25" .frames/bezel.png
python3 encode.py .frames/phone "$OUT/phone.webp" --gap 83 --scale 2 --bezel .frames/bezel.png --at +30+48 --q 76 --still .3
python3 encode.py .frames/desktop "$OUT/desktop.webp" --gap 100 --q 78 --still .93
du -sh "$OUT"
