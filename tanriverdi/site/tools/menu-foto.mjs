// Saves menu photographs into public/menu/ as WebP (longest side 1000 px).
// node tools/menu-foto.mjs <source file>=<name> [<source file>=<name> ...]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { launch } from './browser.mjs';
const pairs = process.argv.slice(2).map((a) => a.split('='));
await mkdir(new URL('../public/menu/', import.meta.url), { recursive: true });
const b = await launch({ webgl: false });
const page = await b.newPage();
for (const [src, name] of pairs) {
  const buf = await readFile(src);
  const mime = src.endsWith('.png') ? 'image/png' : src.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const out = await page.evaluate(async ({ data, mime }) => {
    const img = new Image();
    img.src = `data:${mime};base64,${data}`;
    await img.decode();
    const k = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { b64: c.toDataURL('image/webp', 0.84).split(',')[1], w: c.width, h: c.height };
  }, { data: buf.toString('base64'), mime });
  const file = Buffer.from(out.b64, 'base64');
  await writeFile(new URL(`../public/menu/${name}.webp`, import.meta.url), file);
  console.log(`${name}.webp ${out.w}x${out.h} ${(file.length / 1024).toFixed(0)}kB`);
}
await b.close();
