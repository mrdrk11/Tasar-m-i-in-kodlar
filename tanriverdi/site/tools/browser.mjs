// Shared Playwright launcher for the development tools.
// Uses the browser named in CHROME_PATH, else a preinstalled Chromium if one
// is present, else Playwright's own download.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const CANDIDATES = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium'];
const SOFTWARE_GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
const NO_GL = ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'];

export async function launch({ webgl = true } = {}) {
  const executablePath = CANDIDATES.find((p) => p && existsSync(p));
  return chromium.launch({ executablePath, args: ['--headless=new', '--no-sandbox', ...(webgl ? SOFTWARE_GL : NO_GL)] });
}
