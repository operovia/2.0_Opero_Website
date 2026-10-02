// Renders the OperoGo screenshots: each scripts/go-shots/<screen>.html becomes src/assets/go/<screen>.png, drawn at
// 390 x 844 CSS pixels (an iPhone) at three times that in the file. The site imports them (src/content/go-shots.ts), so a
// re-rendered picture gets a new address and no cache keeps the old one.
//
//   node scripts/go-shots/render.mjs [screen ...]
//
// Needs a Chromium: playwright-core's own (npx playwright install chromium, with the playwright package), or one named
// in CHROME_PATH. The pages are served from the repo root over a local port, so their fonts and brand files load.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const out = path.join(root, 'src', 'assets', 'go');
const SCREENS = ['home', 'oppie', 'inspection', 'leasing'];
const WIDTH = 390;
const HEIGHT = 844;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : SCREENS;
for (const name of wanted) if (!SCREENS.includes(name)) throw new Error(`Unknown screen ${name}. One of: ${SCREENS.join(', ')}.`);

// Serves the repo root read-only, so a page can reach its stylesheet, the brand files and the fonts.
const server = createServer(async (request, response) => {
  const file = path.join(root, decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
  if (!file.startsWith(root)) return response.writeHead(403).end();
  try {
    await stat(file);
    response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  for (const name of wanted) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 3 });
    page.on('pageerror', (error) => console.error(`[${name}] page error:`, error.message));
    page.on('requestfailed', (request) => console.error(`[${name}] failed to load:`, request.url()));
    await page.goto(`http://127.0.0.1:${port}/scripts/go-shots/${name}.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `${name}.png`), type: 'png' });
    console.log(`src/assets/go/${name}.png`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
