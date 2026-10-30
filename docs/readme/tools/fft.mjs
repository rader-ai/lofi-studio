// Record what the app's own analyser hears while each vibe really plays (muted), so the
// scenes' visualisers in the captured frames react to the actual music.
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync(new URL('./.frames/', import.meta.url).pathname, {recursive: true});

const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport: {width: 402, height: 714}});
await page.goto('http://127.0.0.1:8765/index.html');
await page.waitForFunction(() => !document.getElementById('splash'), null, {timeout: 60000});
const names = await page.evaluate(() => VIBES);
const out = {};
for (const name of names){
  out[name] = await page.evaluate(async name => {
    state = Object.assign(makeState(PRESETS[name]), {seed: 4242}); currentVibe = name; currentTrack = null;
    if (!playing) await play(); else { syncUI(); applyState(); setKeysSound(state.keys); reseed(); }
    step = pat.spb * 6;                                  // straight to the groove, past the intro
    await new Promise(r => setTimeout(r, 900));
    const frames = [], t0 = performance.now();
    while (performance.now() - t0 < 7200){
      frames.push(Array.from(A.fft.getValue(), v => Math.round(v * 10) / 10));
      await new Promise(r => setTimeout(r, 60));
    }
    return frames;
  }, name);
  const flat = out[name].flat().filter(Number.isFinite);
  console.log(name, out[name].length, 'frames, avg', (flat.reduce((a, b) => a + b, 0) / flat.length).toFixed(1), 'dB, max', Math.max(...flat).toFixed(1));
}
writeFileSync(new URL('./.frames/fft.json', import.meta.url).pathname, JSON.stringify(out));
await browser.close();
