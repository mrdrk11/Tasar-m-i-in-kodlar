// Scroll through the page and save a contact sheet.
// node tools/tour.mjs <url> <out.png> [--mobile] [--w 1440] [--h 900] [--at "sel:frac,sel:frac,..."] [--cols 3] [--scale 0.5] [--reduced]
//   --at  list of stops: a CSS selector and how far through that element's scroll range (0..1)
import { launch } from './browser.mjs';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const mobile = a.includes('--mobile');
const w = +opt('w', mobile ? 390 : 1440), h = +opt('h', mobile ? 844 : 900);
const stops = opt('at', '.sahne:0,.sahne:0.12,.sahne:0.3,.sahne:0.55,.sahne:0.8,.sahne:1').split(',').map((s) => { const [sel, f] = s.split(':'); return { sel, f: +f }; });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: a.includes('reduced') || a.includes('--reduced') ? 'reduce' : 'no-preference', locale: 'tr-TR' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(a[0], { waitUntil: 'load' });
await page.waitForTimeout(3500);
const frames = [];
for (const s of stops) {
  const y = await page.evaluate(({ sel, f }) => {
    const el = document.querySelector(sel);
    if (!el) return -1;
    const top = el.getBoundingClientRect().top + scrollY;
    const range = Math.max(0, el.offsetHeight - innerHeight);
    const yy = Math.round(top + range * f);
    scrollTo({ top: yy, behavior: 'instant' });
    return yy;
  }, s);
  await page.waitForTimeout(2600);
  const info = await page.evaluate(() => ({ ox: document.documentElement.scrollWidth > innerWidth + 1 }));
  frames.push({ ...s, y, ox: info.ox, png: await page.screenshot() });
}
await browser.close();
const b2 = await launch({ webgl: false });
const cols = +opt('cols', mobile ? 6 : 3), scale = +opt('scale', mobile ? 0.6 : 0.5);
const tw = Math.round(w * scale), th = Math.round(h * scale);
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;width:max-content;font:11px monospace;color:#fff">` +
  frames.map((f) => `<figure style="margin:0"><img width="${tw}" height="${th}" src="data:image/png;base64,${f.png.toString('base64')}"><figcaption>${f.sel} ${f.f} y=${f.y}${f.ox ? ' OVERFLOW-X' : ''}</figcaption></figure>`).join('') + '</body>';
const pg = await b2.newPage({ viewport: { width: cols * (tw + 6) + 6, height: 600 } });
await pg.setContent(html);
await pg.screenshot({ path: a[1], fullPage: true });
await b2.close();
console.log(JSON.stringify({ out: a[1], stops: frames.map((f) => `${f.sel}:${f.f}@${f.y}${f.ox ? ' OVERFLOW' : ''}`), errors }, null, 1));
