// Renders the still images the page shows before (or instead of) each 3D scene,
// plus the share image. Needs the dev server: npm run dev -- --port 5173 --strictPort
// node tools/posters.mjs [name,name…]
import { writeFile } from 'node:fs/promises';
import { launch } from './browser.mjs';

const port = 5173;
const only = process.argv[2]?.split(',');
// name, scene, css size, device scale, query
const POSTERS = [
  ['doner', 'doner', 900, 1160, 1, 'p=0.3&t=2.4&stage=1'],
  ['doner-harf', 'doner', 300, 600, 2, 'p=0&t=2.4&stage=0'],
  ['madalyon', 'madalyon', 700, 700, 1, 'p=0&t=1'],
  ['lezzet-0', 'lezzetler', 1000, 760, 1, 'p=0&t=2&index=0'],
  ['lezzet-1', 'lezzetler', 1000, 760, 1, 'p=0&t=2&index=1'],
  ['lezzet-2', 'lezzetler', 1000, 760, 1, 'p=0&t=2&index=2'],
  ['lezzet-3', 'lezzetler', 1000, 760, 1, 'p=0&t=2&index=3'],
  ['tasfirin', 'tasfirin', 1100, 900, 1, 'p=0.86&t=2'],
  ['yedi24', 'yedi24', 1100, 700, 1, 'p=0.02&t=2'],
].filter((p) => !only || only.includes(p[0]));

const browser = await launch();
const errors = [];
const done = [];
for (const [name, scene, w, h, dpr, query] of POSTERS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/lab.html?scene=${scene}&q=high&bg=none&${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 90000 }).catch(() => errors.push(`${name}: timeout`));
  await page.waitForTimeout(900);
  const png = await page.screenshot({ omitBackground: true });
  // Re-encode as WebP inside the browser: no image library needed.
  const b64 = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.86).split(',')[1];
  }, 'data:image/png;base64,' + png.toString('base64'));
  const buf = Buffer.from(b64, 'base64');
  await writeFile(new URL(`../public/posters/${name}.webp`, import.meta.url), buf);
  done.push(`${name} ${w * dpr}x${h * dpr} ${(buf.length / 1024).toFixed(0)}kB`);
  await ctx.close();
}

if (!only || only.includes('paylasim')) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForSelector('.sahne__gl.is-live', { timeout: 90000 }).catch(() => errors.push('paylasim: scene not live'));
  await page.addStyleTag({ content: '.ipucu,.hareket,.cubuk,.atla{display:none!important}' });
  await page.waitForTimeout(2500);
  const jpg = await page.screenshot({ type: 'jpeg', quality: 88 });
  await writeFile(new URL('../public/brand/paylasim.jpg', import.meta.url), jpg);
  done.push(`paylasim 1200x630 ${(jpg.length / 1024).toFixed(0)}kB`);
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ done, errors }, null, 1));
