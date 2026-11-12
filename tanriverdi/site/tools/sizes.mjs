// One page position at many screen sizes, as a contact sheet, plus layout checks.
// node tools/sizes.mjs <url> <out.png> [--at ".sahne:0"] [--sizes "360x640m,390x844m,..."]
import { launch } from './browser.mjs';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const [sel, frac] = opt('at', '.sahne:0').split(':');
const sizes = opt('sizes', '360x640m,390x844m,844x390m,768x1024m,1024x768,1366x768,1920x1080').split(',');
const browser = await launch();
const frames = [];
const report = [];
for (const s of sizes) {
  const mobile = s.endsWith('m');
  const [w, h] = s.replace('m', '').split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, locale: 'tr-TR' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(a[0], { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  await page.evaluate(({ sel, f }) => {
    const el = document.querySelector(sel);
    const top = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: Math.round(top + Math.max(0, el.offsetHeight - innerHeight) * f), behavior: 'instant' });
  }, { sel, f: +frac });
  await page.waitForTimeout(2600);
  // Visible text or controls that stick out of the viewport sideways, or overlap each other.
  const info = await page.evaluate(() => {
    const out = [];
    const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && cs.display !== 'none'; };
    const shown = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (!vis(e)) return false; return true; };
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,dd,dt,li,figure')) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight || !shown(el)) continue;
      if (el.closest('.tabela,.lezzet__dev,.sahne__perde,.atla')) continue;
      if (r.left < -1 || r.right > innerWidth + 1) out.push(`${el.tagName}.${el.className} sticks out: ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return { overflowX: document.documentElement.scrollWidth > innerWidth + 1, out: out.slice(0, 8) };
  });
  report.push({ size: s, ...info, errors });
  frames.push({ s, w, h, png: await page.screenshot() });
  await ctx.close();
}
await browser.close();
const b2 = await launch({ webgl: false });
const H = 420;
const html = `<body style="margin:0;background:#222;display:flex;flex-wrap:wrap;gap:6px;padding:6px;width:1900px;font:12px monospace;color:#fff">` +
  frames.map((f) => `<figure style="margin:0"><img height="${H}" width="${Math.round(f.w * H / f.h)}" src="data:image/png;base64,${f.png.toString('base64')}"><figcaption>${f.s}</figcaption></figure>`).join('') + '</body>';
const pg = await b2.newPage({ viewport: { width: 1912, height: 600 } });
await pg.setContent(html);
await pg.screenshot({ path: a[1], fullPage: true });
await b2.close();
console.log(JSON.stringify(report, null, 1));
