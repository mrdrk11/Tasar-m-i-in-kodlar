// Development probe: load a page, optionally scroll, run an expression, print the result.
// node tools/probe.mjs <url> "<js expression>" [--w 1440] [--h 900] [--y 0] [--wait 3000] [--mobile]
import { launch } from './browser.mjs';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const browser = await launch();
const mobile = a.includes('--mobile');
const ctx = await browser.newContext({ viewport: { width: +opt('w', mobile ? 390 : 1440), height: +opt('h', mobile ? 844 : 900) }, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(a[0], { waitUntil: 'load' });
await page.waitForTimeout(+opt('wait', 3000));
if (+opt('y', 0)) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), +opt('y', 0)); await page.waitForTimeout(1200); }
const out = await page.evaluate(a[1]);
console.log(JSON.stringify({ result: out, errors }, null, 1));
await browser.close();
