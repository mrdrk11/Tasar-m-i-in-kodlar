// Contact sheet of a scene at several scroll positions and times.
// node tools/lab-shots.mjs <scene> <out.png> [--p 0,0.33,0.66,1] [--t 2] [--w 1280] [--h 800] [--q high] [--bg 0d1a10] [--mobile] [--port 5173]
// Needs the dev server running (npm run dev -- --port 5173 --strictPort).
import { launch } from './browser.mjs';

const a = process.argv.slice(2);
const scene = a[0], out = a[1];
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const has = (k) => a.includes('--' + k);
if (!scene || !out) { console.error('usage: lab-shots.mjs <scene> <out.png> [options]'); process.exit(2); }
const ps = opt('p', '0,0.33,0.66,1').split(',').map(Number);
const ts = opt('t', '2').split(',').map(Number);
const mobile = has('mobile');
const w = +opt('w', mobile ? 390 : 1280), h = +opt('h', mobile ? 844 : 800);
const port = opt('port', '5173'), q = opt('q', mobile ? 'mid' : 'high'), bg = opt('bg', '0d1a10');
// --extra "index=0;index=1" renders one frame set per semicolon-separated query fragment
const extras = opt('extra', '').split(';');

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const frames = [];
let stats = null;
for (const extra of extras) for (const t of ts) for (const p of ps) {
  await page.goto(`http://127.0.0.1:${port}/lab.html?scene=${scene}&p=${p}&t=${t}&q=${q}&bg=${bg}${extra ? '&' + extra : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }).catch(() => errors.push(`timeout waiting for scene at p=${p} t=${t}`));
  await page.waitForTimeout(250);
  stats = await page.evaluate(() => window.__lab?.stats?.() ?? null);
  frames.push({ p, t, extra, png: await page.screenshot() });
}
await browser.close();

// Stitch with a second page (no image library needed).
const b2 = await launch({ webgl: false });
const cols = Math.min(frames.length, mobile ? 4 : 2);
const scale = mobile ? 1 : 0.5;
const tw = Math.round(w * scale), th = Math.round(h * scale);
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;width:max-content;font:12px monospace;color:#fff">` +
  frames.map((f) => `<figure style="margin:0"><img width="${tw}" height="${th}" src="data:image/png;base64,${f.png.toString('base64')}"><figcaption>p=${f.p} t=${f.t} ${f.extra}</figcaption></figure>`).join('') + '</body>';
const pg = await b2.newPage({ viewport: { width: cols * (tw + 6) + 6, height: 600 } });
await pg.setContent(html);
await pg.screenshot({ path: out, fullPage: true });
await b2.close();
console.log(JSON.stringify({ out, frames: frames.length, viewport: `${w}x${h}`, quality: q, stats, errors }, null, 1));
