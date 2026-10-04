#!/usr/bin/env node
/**
 * The website review's layout check (dev only): the hero and the page at the
 * review's seven viewports. For each it reports whether the headline, the
 * bullets, the figures and the whole Oppie card fit on the first
 * screen, whether anything scrolls sideways, and how tall the platform and
 * OperoGo sections and the page are, and saves a first-frame and a settled
 * screenshot.
 *
 *   BASE_URL=http://localhost:3000 SESSION_COOKIE="name=value" node scripts/check-layout.mjs
 *   BASE_URL=http://localhost:3000 LOGIN_EMAIL=... LOGIN_PASSWORD=... node scripts/check-layout.mjs
 *
 * The site is private, so give it a session: a cookie from a signed-in
 * browser, or an admin email and password to sign in with. Screenshots go to
 * OUT_DIR (default: layout-check/, which git ignores). Needs a Chromium:
 * playwright-core's own, or one named in CHROME_PATH.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const COOKIE = process.env.SESSION_COOKIE || '';
const OUT = process.env.OUT_DIR || 'layout-check';
const SIZES = [
  [393, 659],
  [430, 739],
  [375, 548],
  [1366, 650],
  [1536, 730],
  [1440, 790],
  [1920, 950],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });

// Signs in once, when asked, and carries that session into every viewport.
let storageState;
if (!COOKIE && process.env.LOGIN_EMAIL) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name=email]', process.env.LOGIN_EMAIL);
  await page.fill('input[name=password]', process.env.LOGIN_PASSWORD || '');
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/admin/login')), page.click('button[type=submit]')]);
  storageState = await ctx.storageState();
  await ctx.close();
}

for (const [width, height] of SIZES) {
  const phone = width < 768;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone, storageState });
  if (COOKIE) {
    const i = COOKIE.indexOf('=');
    await ctx.addCookies([{ name: COOKIE.slice(0, i), value: COOKIE.slice(i + 1), url: BASE }]);
  }
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `first-frame-${width}x${height}.png`) });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const m = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    const height = (sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().height) : null;
    };
    return {
      vh: window.innerHeight,
      hscroll: document.documentElement.scrollWidth > window.innerWidth,
      h1: box('#hero-title'),
      bullets: box('[data-testid="hero-bullets"]'),
      stats: box('[data-testid="hero-stats"]'),
      card: box('[data-testid="hero-oppie-card"]'),
      platformH: height('#platform'),
      operogoH: height('#operogo'),
      pageH: document.documentElement.scrollHeight,
    };
  });

  const fits = (k) => (m[k] ? m[k].bottom <= m.vh : 'missing');
  console.log(`${width}x${height}`, {
    h1: fits('h1'),
    bullets: fits('bullets'),
    stats: fits('stats'),
    card: fits('card'),
    cardTop: m.card ? m.card.top : null,
    cardBottom: m.card ? m.card.bottom : null,
    h1Bottom: m.h1 ? m.h1.bottom : null,
    vh: m.vh,
    hscroll: m.hscroll,
    platformH: m.platformH,
    operogoH: m.operogoH,
    pageH: m.pageH,
  });
  await page.screenshot({ path: path.join(OUT, `layout-${width}x${height}.png`) });
  await ctx.close();
}
await browser.close();
