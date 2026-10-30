// Records the real app in real time: real touch or mouse input, the real audio engine running
// (muted), every frame timestamped by the browser's own screencast.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const mode = process.argv[2] || 'phone';
const DIR = new URL(`./.frames/${mode}/`, import.meta.url).pathname;
rmSync(DIR, {recursive: true, force: true}); mkdirSync(DIR, {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required']});
const phone = mode === 'phone';
const context = await browser.newContext(phone
  ? {viewport: {width: 402, height: 714}, deviceScaleFactor: +(process.argv[3] || 1), hasTouch: true, isMobile: true}
  : {viewport: {width: 1100, height: 620}, deviceScaleFactor: 1});
const page = await context.newPage();
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.addInitScript(() => {
  try { localStorage.setItem('lofi.swiped', '1'); } catch (e) {}
  // show the finger or pointer, which a recording doesn't otherwise have
  addEventListener('DOMContentLoaded', () => {
    const el = document.createElement('div');
    const cells = []; const R = 5.4;
    const touch = matchMedia('(pointer:coarse)').matches;
    if (touch){
      for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++){
        const d = Math.hypot(x - 6, y - 6);
        if (d <= R + .9) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${d > R - .3 ? '#ece6ff' : 'rgba(236,230,255,.38)'}"/>`);
      }
      el.innerHTML = `<svg width="52" height="52" viewBox="0 0 13 13" shape-rendering="crispEdges" style="display:block">${cells.join('')}</svg>`;
      el.style.cssText = 'position:fixed;left:0;top:0;margin:-26px 0 0 -26px;z-index:99999;pointer-events:none;opacity:0';
      addEventListener('pointerdown', e => { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; el.style.opacity = 1; }, true);
      addEventListener('pointermove', e => { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; }, true);
      for (const t of ['pointerup', 'pointercancel']) addEventListener(t, () => setTimeout(() => { el.style.opacity = 0; }, 70), true);
    } else {
      // a pixel arrow
      const A = ['X...........','XX..........','XoX.........','XooX........','XoooX.......','XooooX......','XoooooX.....','XooooooX....','XoooooooX...','XooooooooX..','XoooooXXXXX.','XooXooX.....','XoX.XooX....','XX..XooX....','X....XooX...','.....XooX...','......XX....'];
      A.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${c === 'X' ? '#07040f' : '#ffffff'}"/>`); }));
      el.innerHTML = `<svg width="24" height="34" viewBox="0 0 12 17" shape-rendering="crispEdges" style="display:block">${cells.join('')}</svg>`;
      el.style.cssText = 'position:fixed;left:-40px;top:-40px;z-index:99999;pointer-events:none';
      addEventListener('mousemove', e => { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; }, true);
    }
    document.documentElement.append(el);
  });
});
await page.goto('http://127.0.0.1:8765/index.html');
await page.waitForFunction(() => !document.getElementById('splash') && !!window.Tone, null, {timeout: 60000});
await page.evaluate(() => document.fonts.ready);
// at this size the browser would thin the scene's pixels; a real phone has three times as many,
// so smooth the scale-down to stay close to what people actually see
if (phone) await page.addStyleTag({content: 'canvas#viz,.stage .ghost{image-rendering:auto !important}'});
await sleep(1200);   // let the studio's entrance finish

const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({data, metadata, sessionId}) => {
  const n = frames.length, file = String(n).padStart(4, '0') + '.png';
  frames.push({file, t: metadata.timestamp});
  writeFileSync(join(DIR, file), Buffer.from(data, 'base64'));
  cdp.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
});

const box = async sel => { const b = await page.locator(sel).first().boundingBox(); return {x: b.x + b.width / 2, y: b.y + b.height / 2, b}; };
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: type === 'touchEnd' ? [] : [{x, y}]});
async function tap(sel){
  const {x, y} = await box(sel);
  await touch('touchStart', x, y); await sleep(130); await touch('touchEnd');
}
async function swipe(dir = -1){
  const {b} = await box('#stage'), y = b.y + b.height * .62, x0 = b.x + b.width * (dir < 0 ? .78 : .22), dist = b.width * .52;
  await touch('touchStart', x0, y); await sleep(50);
  for (let i = 1; i <= 14; i++){ await touch('touchMove', x0 + dir * dist * (1 - Math.pow(1 - i / 14, 2)), y); await sleep(20); }
  await touch('touchEnd');
}
async function click(sel, glide = 22){
  const {x, y} = await box(sel);
  await page.mouse.move(x, y, {steps: glide}); await sleep(120);
  await page.mouse.down(); await sleep(70); await page.mouse.up();
}
async function drag(sel, from, to, ms = 900){
  const {b} = await box(sel), y = b.y + b.height / 2, X = f => b.x + b.width * f;
  await page.mouse.move(X(from), y, {steps: 18}); await sleep(90); await page.mouse.down();
  const steps = Math.round(ms / 28);
  for (let i = 1; i <= steps; i++){ await page.mouse.move(X(from + (to - from) * i / steps), y); await sleep(20); }
  await page.mouse.up();
}

const VP = page.viewportSize(), DSF = 1;
await cdp.send('Page.startScreencast', {format: 'png', everyNthFrame: 1, maxWidth: VP.width * DSF, maxHeight: VP.height * DSF});
await sleep(700);
if (phone){
  await tap('#play');                             // music on
  await sleep(2000);
  await swipe(); await sleep(1600);               // Rainy Window
  await swipe(); await sleep(1600);               // Coffee Shop Jazz
  await swipe(); await sleep(1600);               // Sunday Morning
  await tap('#modes [data-mode=albums]');         // Albums takes over
  await sleep(1500);
  await tap('#albumTracks li:nth-child(3) button');
  await sleep(1400);
  await swipe(); await sleep(1800);               // the next album
  await tap('#modes [data-mode=custom]');         // back to your own track
  await sleep(1400);
} else {
  await page.mouse.move(820, 560);
  await sleep(250);
  await click('#tab-albums'); await sleep(700);
  await page.evaluate(() => selectAlbum(4));            // Seeds & Sunlight: the garden
  await sleep(900);
  await click('#albumsView [data-playalbum]'); await sleep(1500);
  await click('#tab-shape'); await sleep(450);
  await drag('#bpm', .62, .26, 800); await sleep(450);
  await drag('#vintage', .4, .9, 700); await sleep(600);
  await click('#tab-mix'); await sleep(900);
  await click('[data-layer="drums"]'); await sleep(1100);
  await click('[data-layer="drums"]'); await sleep(900);
  await click('[data-layer="rain"]'); await sleep(1500);
}
await cdp.send('Page.stopScreencast');
await sleep(150);
writeFileSync(join(DIR, 'index.json'), JSON.stringify(frames));
const dur = frames.at(-1).t - frames[0].t;
console.log(mode, frames.length, 'frames in', dur.toFixed(1) + 's', '=', (frames.length / dur).toFixed(1), 'fps');
await browser.close();
