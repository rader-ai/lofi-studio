// The README's title screen: the real worlds slide past, attract-mode style, behind the
// logo plate. Scenes are painted by the app's own drawScene(); this only composes them at 2x.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { openStudio, HARNESS, FFT } from './scenes.mjs';

const DIR = new URL('./.frames/hero/', import.meta.url).pathname;
rmSync(DIR, {recursive: true, force: true}); mkdirSync(DIR, {recursive: true});
const {browser, page} = await openStudio();
await page.evaluate(HARNESS, FFT);

await page.evaluate(() => {
  const W = 1280, H = 600, viz = document.getElementById('viz');
  const cv = Object.assign(document.createElement('canvas'), {width: W, height: H});
  const h = cv.getContext('2d'); h.imageSmoothingEnabled = false;
  const INK = '#07040f', EDGE = '#5b4a9e', GOLD = '#f5c542', TEXT = '#ece6ff', TEAL = '#4fd1c5', PIXEL = '"Press Start 2P"', BODY = 'VT323';
  const copyOf = src => { const c = Object.assign(document.createElement('canvas'), {width: src.width, height: src.height}); c.getContext('2d').drawImage(src, 0, 0); return c; };
  const ease = p => 1 - Math.pow(1 - p, 3);
  const rect = (x, y, w, h2, c) => { h.fillStyle = c; h.fillRect(x, y, w, h2); };
  const text = (s, x, y, font, c) => { h.font = font; h.fillStyle = c; h.textBaseline = 'top'; h.fontKerning = 'none'; h.fillText(s, x, y); };

  // the logo plate, in the same dress as the link-preview card
  function plate(dy, frame){
    const x = 52, y = 44 + dy, w = 792, ph = 252;
    rect(x + 16, y + 16, w + 12, ph + 12, 'rgba(0,0,0,.5)');
    rect(x - 6, y - 6, w + 12, ph + 12, INK);
    rect(x, y, w, ph, EDGE);
    rect(x + 6, y + 6, w - 12, ph - 12, INK);
    rect(x + 10, y + 10, w - 20, ph - 20, 'rgb(13,9,32)');
    for (const sx of [x + 16, x + w - 26]){ rect(sx - 3, y + 13, 16, 16, INK); rect(sx, y + 16, 10, 10, GOLD); }
    // the title, one letter at a time: a little wave rolls through it once
    const title = 'LOFI STUDIO', tx = x + 44, ty = y + 40;
    [...title].forEach((ch, i) => {
      if (ch === ' ') return;
      const start = 14 + i * 1.3, bob = frame >= start && frame < start + 3 ? -8 : 0, lx = tx + i * 64;
      text(ch, lx + 10, ty + 10 + bob, `64px ${PIXEL}`, '#3b2a7a');
      text(ch, lx + 5, ty + 5 + bob, `64px ${PIXEL}`, INK);
      text(ch, lx, ty + bob, `64px ${PIXEL}`, i < 4 ? TEXT : GOLD);
    });
    text('cozy beats for tiny pixel worlds', tx, y + 128, `48px ${BODY}`, TEXT);
    // "press start": the whole picture is a link to the app
    if (frame % 16 < 11){
      const py = y + 191, px = tx;
      for (let r = 0; r < 7; r++) rect(px + r * 3, py + r * 3, 3, 36 - r * 6, TEAL);
      text('click to play', tx + 34, y + 184, `48px ${BODY}`, TEAL);
    }
  }

  // the same title card and dots the app shows on the scene
  function card(i){
    const name = VIBES[i].toUpperCase(), ds = VIBE_INFO[VIBES[i]].ds;
    h.font = `24px ${PIXEL}`; const nw = h.measureText(name).width; h.font = `32px ${BODY}`; const dw = h.measureText(ds).width;
    const w = Math.max(nw, dw) + 44, x = Math.round((W - w) / 2), y = 22, ch = 88;
    rect(x - 4, y - 4, w + 8, ch + 8, EDGE); rect(x, y, w, ch, 'rgba(7,4,15,.94)');
    text(name, Math.round((W - nw) / 2), y + 14, `24px ${PIXEL}`, GOLD);
    text(ds, Math.round((W - dw) / 2), y + 46, `32px ${BODY}`, TEXT);
    const n = VIBES.length, dot = 15, gap = 15, on = 36, total = (n - 1) * dot + on + (n - 1) * gap;
    let dx = Math.round((W - total) / 2); const dy = H - 42;
    rect(dx - 12, dy - 9, total + 24, dot + 18, 'rgba(7,4,15,.75)');
    for (let d = 0; d < n; d++){ const dw2 = d === i ? on : dot; rect(dx, dy, dw2, dot, d === i ? GOLD : '#5a4f8a'); dx += dw2 + gap; }
  }

    window.__hero = {
    cv, plate, card, ease, h, viz, W, H, copyOf,
    world(x = 0){ h.drawImage(viz, x, 0, W, H); },
    ghost(g, x){ h.drawImage(g, x, 0, W, H); },
    png(){ return cv.toDataURL('image/png').split(',')[1]; },
  };
});

let n = 0;
const emit = b64 => writeFileSync(join(DIR, String(n++).padStart(4, '0') + '.png'), Buffer.from(b64, 'base64'));

// a shutter wipe: the next world is revealed behind a moving edge, each picture staying put
await page.evaluate(() => {
  __hero.layer = () => __hero.copyOf(__hero.cv);
  __hero.wipe = (from, drawNext, f, frames) => {
    const {h, W, H, ease} = __hero, x = W - Math.round(ease((f + 1) / (frames + 1)) * W);
    h.drawImage(from, 0, 0);
    h.save(); h.beginPath(); h.rect(x, 0, W - x, H); h.clip(); drawNext(); h.restore();
    h.fillStyle = '#07040f'; h.fillRect(x - 8, 0, 8, H);
    h.fillStyle = '#5b4a9e'; h.fillRect(x - 4, 0, 4, H);
  };
});

// the castle first: a few frames are kept to wipe back in at the end, so the loop closes exactly
const WIPE = 5, TITLE = 40, OUT = 6, CASTLE_REST = 8, HOLD = 24;
await page.evaluate(WIPE => {
  __cap.setVibe(0); __cap.warm(14);
  __hero.pre = [];
  for (let i = 0; i < WIPE; i++){ __cap.tick(.06); __hero.pre.push(__hero.copyOf(__hero.viz)); }
}, WIPE);

for (let f = 0; f < TITLE; f++) emit(await page.evaluate(f => { __cap.tick(.06); __hero.world(); __hero.plate(0, f); return __hero.png(); }, f));
// the plate lifts away and the first title card takes over
for (let f = 0; f < OUT; f++) emit(await page.evaluate(([f, OUT, TITLE]) => {
  __cap.tick(.06); __hero.world(); __hero.card(0);
  __hero.plate(-Math.round(__hero.ease((f + 1) / OUT) * 340), TITLE + f);
  return __hero.png();
}, [f, OUT, TITLE]));
for (let f = 0; f < CASTLE_REST; f++) emit(await page.evaluate(() => { __cap.tick(.06); __hero.world(); __hero.card(0); return __hero.png(); }));

// then on to each world in turn
for (let i = 1; i < 8; i++){
  await page.evaluate(i => { __hero.old = __hero.layer(); __cap.setVibe(i); __cap.warm(14); }, i);
  for (let f = 0; f < WIPE; f++) emit(await page.evaluate(([i, f, WIPE]) => {
    __cap.tick(.06);
    __hero.wipe(__hero.old, () => { __hero.world(); __hero.card(i); }, f, WIPE);
    return __hero.png();
  }, [i, f, WIPE]));
  for (let f = 0; f < HOLD; f++) emit(await page.evaluate(i => { __cap.tick(.06); __hero.world(); __hero.card(i); return __hero.png(); }, i));
}

// home again: the castle's kept frames and the plate wipe back in, right before the first frame
await page.evaluate(() => { __hero.old = __hero.layer(); });
for (let f = 0; f < WIPE; f++) emit(await page.evaluate(([f, WIPE]) => {
  __hero.wipe(__hero.old, () => { __hero.ghost(__hero.pre[f], 0); __hero.plate(0, 0); }, f, WIPE);
  return __hero.png();
}, [f, WIPE]));

console.log('hero frames:', n);
await browser.close();
