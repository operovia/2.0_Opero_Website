// Renders the email invitation graphic: scripts/email-art/invite.html becomes public/email/opero-invite.png, the 1200 x 630
// card with rounded corners on white, 1280 x 710 and opaque, so it blends into a white email. The site serves it at
// /email/opero-invite.png (outside the front door's gate).
//
//   node scripts/email-art/render.mjs
//   node scripts/email-art/render.mjs --name "Fifth Wall"
//
// With --name it renders one guest's own card instead, greeting them by that name over the red carpet, into
// scripts/email-art/personal/ (opero-invite-fifth-wall.png). That one stays out of public/, so the name is never
// published at an address anyone could guess: paste it into the email.
//
// Needs a Chromium: playwright-core's own, or one named in CHROME_PATH. The page is served from the repo root over a
// local port, so its font and the logo load.
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const flag = process.argv.indexOf('--name');
const name = flag === -1 ? '' : (process.argv[flag + 1] ?? '').replace(/\s+/g, ' ').trim();
if (flag !== -1 && !name) throw new Error('--name needs the name, in quotes: --name "Fifth Wall"');
const slug = name
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const out = name
  ? path.join(root, 'scripts', 'email-art', 'personal', `opero-invite-${slug || 'guest'}.png`)
  : path.join(root, 'public', 'email', 'opero-invite.png');
const types = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

// Serves the repo root read-only, so the page can reach the font and the logo.
const server = createServer(async (request, response) => {
  const file = path.join(root, decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
  if (!file.startsWith(root)) return response.writeHead(403).end();
  let body;
  try {
    body = await readFile(file);
  } catch {
    return response.writeHead(404).end();
  }
  response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  response.end(body);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 710 }, deviceScaleFactor: 1 });
  page.on('requestfailed', (request) => console.error('failed to load:', request.url()));
  const query = name ? `?name=${encodeURIComponent(name)}` : '';
  await page.goto(`http://127.0.0.1:${port}/scripts/email-art/invite.html${query}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'png' });
  console.log(path.relative(root, out));
} finally {
  await browser.close();
  server.close();
}
