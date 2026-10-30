// The README's section plates, buttons and album covers, drawn in the app's own dress:
// its colours, its fonts, its pixel icons. The covers come from the app's own paintCover().
import { chromium } from 'playwright-core';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = process.argv[2];
const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--mute-audio']});
const app = await browser.newPage({viewport: {width: 1100, height: 800}});
await app.goto('http://127.0.0.1:8765/index.html');
await app.waitForFunction(() => !document.getElementById('splash'), null, {timeout: 60000});

// ----- album covers -----
const covers = await app.evaluate(async () => {
  await document.fonts.load('24px "Press Start 2P"');
  return ALBUMS.map(al => {
    const art = document.createElement('canvas'); paintCover(art, al);
    const out = Object.assign(document.createElement('canvas'), {width: 600, height: 600});
    const g = out.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, 0, 600, 600);
    // the same cartridge-style title block as the app's downloadable cover
    g.font = '24px "Press Start 2P"'; g.textBaseline = 'top';
    const lines = []; let line = '';
    for (const w of al.title.toUpperCase().split(' ')){
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > 530 && line){ lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
    // a solid ink outline, so the gold reads over a bright sky as well as a dark room
    lines.forEach((l, i) => {
      const y = 30 + i * 38;
      g.fillStyle = '#07040f';
      for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-3, -3], [3, -3], [-3, 3], [3, 3], [6, 6], [3, 6], [6, 3]]) g.fillText(l, 30 + dx, y + dy);
      g.fillStyle = '#f5c542'; g.fillText(l, 30, y);
    });
    return {id: al.id, png: out.toDataURL('image/png').split(',')[1]};
  });
});
const { writeFileSync } = await import('node:fs');
for (const c of covers){
  const file = join(OUT, `cover-${c.id}.png`);
  writeFileSync(file, Buffer.from(c.png, 'base64'));
  execFileSync('magick', [file, '-dither', 'None', '-colors', '256', `PNG8:${file}`]);
}
const facts = await app.evaluate(() => ({
  albums: ALBUMS.length, tracks: ALBUMS.reduce((n, a) => n + a.tracks.length, 0),
  minutes: Math.round(ALBUMS.reduce((n, a) => n + a.tracks.reduce((m, t) => m + trackSeconds(t), 0), 0) / 60),
  vibes: VIBES.length, styles: Object.keys(STYLES).length,
}));
console.log(JSON.stringify(facts));

// ----- the icons, straight from the app -----
const icon = sel => app.evaluate(s => document.querySelector(s).outerHTML, sel);
const ICONS = {
  note: await icon('#tab-vibe svg'), sliders: await icon('#tab-shape svg'), record: await icon('#tab-albums svg'), pen: await icon('#modes .ti-pen'),
  phone: '<svg class="ti" viewBox="0 0 8 8"><rect x="2" y="0" width="4" height="8"/><rect class="acc" x="3" y="1" width="2" height="5"/></svg>',
  file: '<svg class="ti" viewBox="0 0 8 8"><path d="M1 0h4v1h1v1h1v6h-6z"/><rect class="acc" x="5" y="0" width="1" height="1"/><rect class="acc" x="6" y="1" width="1" height="1"/><rect class="gv" x="2" y="3" width="4" height="1"/><rect class="gv" x="2" y="5" width="4" height="1"/></svg>',
};
const PLAY = '<svg class="ti" viewBox="0 0 8 8"><rect x="0" y="0" width="2" height="8"/><rect x="2" y="1" width="2" height="6"/><rect x="4" y="2" width="2" height="4"/><rect x="6" y="3" width="2" height="2"/></svg>';

const page = await browser.newPage({viewport: {width: 1000, height: 400}, deviceScaleFactor: 2});
await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;background:transparent}
  .ti{display:block;flex:none;fill:currentColor;shape-rendering:crispEdges;overflow:visible}
  .ti .acc{fill:#f5c542} .ti .gl{fill:#fff6d6} .ti .gv{fill:rgba(7,4,15,.45)} .ti *{transform-box:fill-box}
  #stage{display:inline-block;padding:4px}
  .plate{box-sizing:border-box;width:822px;display:flex;align-items:center;gap:18px;padding:17px 24px 16px;position:relative;
    background:linear-gradient(180deg,#2a2058 0 4px,#1d1640 4px);border:4px solid #5b4a9e;
    box-shadow:0 0 0 4px #07040f, inset 0 0 0 3px #07040f, inset 0 0 0 6px #241b4c;color:#ece6ff}
  .plate::before,.plate::after{content:"";position:absolute;top:6px;width:6px;height:6px;background:#f5c542;box-shadow:0 0 0 2px #07040f}
  .plate::before{left:6px} .plate::after{right:6px}
  .plate .ti{width:32px;height:32px}
  .plate b{font:20px/1.2 "Press Start 2P";font-weight:normal;color:#f5c542;text-shadow:2px 2px 0 #07040f, 4px 4px 0 #3b2a7a}
  .btn{display:inline-flex;align-items:center;gap:14px;font:16px/1 "Press Start 2P";padding:20px 26px;margin:3px;
    box-shadow:0 0 0 3px #07040f, inset -4px -4px 0 rgba(0,0,0,.4), inset 4px 4px 0 rgba(255,255,255,.14)}
  .btn .ti{width:20px;height:20px}
  .btn.go{background:#e8692c;color:#07040f} .btn.go .ti .acc{fill:#07040f}
  .btn.own{background:#2a2058;color:#ece6ff}
</style></head><body><div id="stage"></div></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([document.fonts.load('20px "Press Start 2P"'), document.fonts.load('16px "Press Start 2P"')]));

async function shot(html, file){
  await page.evaluate(h => { document.getElementById('stage').innerHTML = h; }, html);
  await page.locator('#stage').screenshot({path: join(OUT, file), omitBackground: true});
}
const PLATES = [
  ['worlds', 'note', 'A band for every room'],
  ['phone', 'phone', 'Swipe it on your phone'],
  ['studio', 'sliders', 'A real studio when you want one'],
  ['albums', 'record', 'Seven albums, ready to play'],
  ['file', 'file', 'All of it in one HTML file'],
  ['own', 'pen', 'Make it your own'],
];
for (const [name, ic, title] of PLATES) await shot(`<div class="plate">${ICONS[ic]}<b>${title}</b></div>`, `plate-${name}.png`);
await shot(`<div class="btn go">${PLAY}PLAY IT NOW</div>`, 'button-play.png');
await shot(`<div class="btn own">${ICONS.pen}BUILD YOUR OWN</div>`, 'button-build.png');
await browser.close();
