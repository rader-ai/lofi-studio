// Frame-exact capture of the real scenes. The app's own drawScene() paints every frame;
// only the clock is stepped by hand, so motion is smooth and nothing depends on capture speed.
// The app's rare moments would be a long wait in a six second loop, so each world is staged:
// its own sights and actions, asked for by name, timed to fall inside the recording.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = new URL('./.frames/', import.meta.url).pathname;
const APP = 'http://127.0.0.1:8765/index.html';
export const FRAME = 0.06;        // seconds per frame (about 16.7 fps; GIF-friendly at 6 centiseconds)

export async function openStudio(viewport = {width: 402, height: 714}){
  const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
  const page = await browser.newPage({viewport, deviceScaleFactor: 1});
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto(APP);
  await page.waitForFunction(() => !document.getElementById('splash'), null, {timeout: 60000});
  await page.evaluate(() => document.fonts.ready);
  return {browser, page};
}

// Take over the clock. Everything else is the app's own code.
export const FFT = JSON.parse(readFileSync(new URL('./.frames/fft.json', import.meta.url).pathname, 'utf8'));
export const HARNESS = FFT => {
  window.requestAnimationFrame = () => 0;
  let now = 1e6, beatClock = 0;
  performance.now = () => now;
  // the scenes' little visualisers replay what the real analyser heard while this vibe played
  let bins = FFT[VIBES[0]][0];
  A = {fft: {getValue: () => bins}};
  playing = true;
  const cap = window.__cap = {
    setVibe(i){
      const name = VIBES[i];
      state = makeState(PRESETS[name]); state.seed = 4242;
      currentVibe = name; currentTrack = null; vibeAt = i; tab = 'vibe';
    },
    tick(dt){
      now += dt * 1000;
      const before = beatClock;
      beatClock += dt * state.bpm / 60 * 2;   // eighth notes, like the sequencer
      if (Math.floor(beatClock) !== Math.floor(before)) sceneBeat(Math.floor(beatClock) % 2 === 0);
      const rec = FFT[VIBES[vibeAt]];
      bins = rec[Math.floor(now / 60) % rec.length];
      drawScene();
    },
    warm(seconds){ for (let s = 0; s < seconds; s += .05) cap.tick(.05); },
    png(){ return document.getElementById('viz').toDataURL('image/png').split(',')[1]; },
    // Sets up a world so that its best moment comes `lead` seconds from now.
    stage(place, lead){
      const sight = (lane, name) => { (pst[lane] ||= {wait: 1e9, now: null, bag: []}).force = name; };
      const act = (name, at) => { life.met = true; life.wait = 1e9; life.act = ACTIONS[name]; life.name = name; life.at = at; life.rate = 1; };
      const fixed = (r, f) => { const keep = Math.random; Math.random = () => r; f(); Math.random = keep; };
      life.act = null; life.wait = 1e9;
      if (place === 'castle'){
        // the dragon crosses the moon while they read and walk
        fixed(.2, () => { (pst.cSky ||= {wait: 1e9, now: null, bag: []}).now = dragonSight(28)(); });
        cap.warm(13.2 - lead);
        act('read', 3);
      } else if (place === 'office'){
        // the cat is on the keyboard again
        cap.warm(1);
        Object.assign(pst.officeCat, {home: false, leg: 5, u: .01, x: 90, y: 104, dir: -1, from: null});
        act('pet', Math.max(0, 1.6 - lead));
      } else if (place === 'cafe'){
        // a long sip while the bus goes by
        sight('cafeStreet', 'bus');
        cap.warm(2);
        act('sip', 2.6 - lead);
      } else if (place === 'garden'){
        // a butterfly comes to her finger, and a squirrel runs along the fence
        sight('gardenFence', 'squirrel');
        cap.warm(7);
        act('finger', 3.2 - lead);
      } else if (place === 'forest'){
        // a comet overhead, a deer at the edge of the clearing, and the marshmallow goes up
        sight('forestSky', 'comet'); sight('forestEdge', 'deer');
        cap.warm(10);
        act('smoreFire', 9.4 - lead);
      } else if (place === 'lake'){
        // ducklings go by, and there's a fish on the line
        sight('lakeWater', 'ducks');
        cap.warm(16);
        act('fish', 14.4 - lead);
      } else if (place === 'park'){
        // crumbs for the pigeons, a kite on the hill and a jogger on the path
        sight('parkSky', 'kite');
        cap.warm(10);
        const [stroller, , jogger] = pst.parkFolk;
        Object.assign(jogger, {dir: 1, x: 20}); Object.assign(stroller, {dir: -1, x: 262});
        act('feed', Math.max(.4, 2.6 - lead));
      } else if (place === 'beach'){
        // the whale breaches, the pier behind us, with a crab on its way across
        scene.scroll = 150;
        sight('beachSea', 'whale');
        cap.warm(8.4 - lead - 3);
        sight('beachSand', 'crab');
        cap.warm(3);
      }
    },
  };
  Math.random = mulberry32(2026);   // the same film every time, unless the app changes
};

const save = (dir, n, b64) => writeFileSync(join(dir, String(n).padStart(4, '0') + '.png'), Buffer.from(b64, 'base64'));

// A looping card of one scene: its last frames dissolve (ordered dither, in the scene's own
// 2px cells) into the frames just before the first, so the loop has no visible seam.
export async function captureLoop(page, vibeIndex, name, frames = 100, overlap = 8){
  const dir = join(OUT, name); rmSync(dir, {recursive: true, force: true}); mkdirSync(dir, {recursive: true});
  await page.evaluate(([i, name]) => { __cap.setVibe(i); __cap.warm(2); __cap.stage(name, 1.7); }, [vibeIndex, name]);
  await page.evaluate(o => {
    const cv = document.getElementById('viz'), g = cv.getContext('2d', {willReadFrequently: true});
    __cap.lead = [];
    for (let i = 0; i < o; i++){ __cap.tick(.06); __cap.lead.push(g.getImageData(0, 0, cv.width, cv.height)); }
  }, overlap);
  for (let n = 0; n < frames; n++){
    const b64 = await page.evaluate(([n, frames, o]) => {
      __cap.tick(.06);
      if (n < frames - o) return __cap.png();
      const cv = document.getElementById('viz'), g = cv.getContext('2d');
      const j = n - (frames - o), p = (j + 1) / (o + 1), from = g.getImageData(0, 0, cv.width, cv.height), to = __cap.lead[j];
      const out = new ImageData(new Uint8ClampedArray(from.data), cv.width, cv.height), B = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++)
        if ((B[((y >> 1) & 3) * 4 + ((x >> 1) & 3)] + .5) / 16 < p){ const q = (y * cv.width + x) * 4; out.data[q] = to.data[q]; out.data[q+1] = to.data[q+1]; out.data[q+2] = to.data[q+2]; }
      const tmp = Object.assign(document.createElement('canvas'), {width: cv.width, height: cv.height});
      tmp.getContext('2d').putImageData(out, 0, 0);
      return tmp.toDataURL('image/png').split(',')[1];
    }, [n, frames, overlap]);
    save(dir, n, b64);
  }
  return dir;
}

if (process.argv[1].endsWith('scenes.mjs')){
  const {browser, page} = await openStudio();
  await page.evaluate(HARNESS, FFT);
  const which = process.argv[2] ? process.argv[2].split(',').map(Number) : [0, 1, 2, 3, 4, 5, 6, 7];
  const names = await page.evaluate(() => VIBES.map(v => VIBE_PLACE[v]));
  const LENGTH = {castle: 66, lake: 90, cafe: 90, forest: 90};   // scrolling and rain cost the most
  for (const i of which){
    const t0 = Date.now();
    await captureLoop(page, i, names[i], LENGTH[names[i]] || 100);
    console.log(names[i], 'captured in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await browser.close();
}
