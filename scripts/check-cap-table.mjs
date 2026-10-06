// scripts/check-cap-table.mjs: the cap table handoff's browser check (its Appendix B), dev only, never part of the site.
// Changed from the handoff only where this project differs: it imports playwright-core (the project's dev dependency) with an
// optional CHROME_PATH for the browser, and reads the golden values the unit tests share: by default those of the shipped round
// ($1,000,000, src/lib/cap-table-golden-round.json, all 39 positions); GOLDEN="src/lib/cap-table-golden.json" checks a page
// saved with the handoff's own $750,000 round against its Appendix A.
// Usage: PAGE_URL="http://localhost:3000/<investor page path>" SESSION_COOKIE="name=value" node scripts/check-cap-table.mjs
import { chromium } from "playwright-core";
import fs from "fs";

const PAGE_URL = process.env.PAGE_URL;
const COOKIE = process.env.SESSION_COOKIE || "";
const goldenFile = process.env.GOLDEN ? new URL(process.env.GOLDEN, new URL("../", import.meta.url)) : new URL("../src/lib/cap-table-golden-round.json", import.meta.url);
const golden = JSON.parse(fs.readFileSync(goldenFile, "utf8"));

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 790 } });
if (COOKIE) {
  const i = COOKIE.indexOf("=");
  await ctx.addCookies([{ name: COOKIE.slice(0, i), value: COOKIE.slice(i + 1), url: PAGE_URL }]);
}
const page = await ctx.newPage();
await page.goto(PAGE_URL, { waitUntil: "networkidle" });

// First number-like token in an element: "$300,000", "40%", "3.00%", "324,324".
const value = async (testId) => {
  const t = (await page.getByTestId(testId).first().textContent()) || "";
  const m = t.match(/\$?\d[\d,]*(\.\d+)?%?/);
  return m ? m[0] : `(no number in "${t.trim()}")`;
};
let failures = 0;
const check = (label, got, want) => {
  if (got !== want) { failures++; console.log(`FAIL ${label}: got ${got}, expected ${want}`); }
};
const setSlider = (v) => page.getByTestId("cap-slider").evaluate((el, val) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(el, String(val));
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}, v);

for (const step of golden.steps) {
  await setSlider(step.investment);
  const at = `at ${step.you_amount}`;
  check(`${at} your amount`, await value("cap-you-amount"), step.you_amount);
  check(`${at} share of round`, await value("cap-share-of-round"), step.share_of_round);
  check(`${at} your %`, await value("cap-you-pct"), step.you_pct);
  check(`${at} your shares`, await value("cap-you-shares"), step.you_shares);
  check(`${at} others %`, await value("cap-others-pct"), step.others_pct);
  check(`${at} others shares`, await value("cap-others-shares"), step.others_shares);
  check(`${at} total after`, await value("cap-total-after-shares"), step.total_after_shares);
  if (step.others_amount === null) {
    const n = await page.getByTestId("cap-others-amount").count();
    if (n !== 0) { failures++; console.log(`FAIL ${at}: remaining amount should be hidden`); }
  } else {
    check(`${at} remaining`, await value("cap-others-amount"), step.others_amount);
  }
  for (const [testId, want] of Object.entries(golden.static)) check(`${at} ${testId}`, await value(testId), want);
}

// Below the minimum snaps to $50,000.
await setSlider(25000);
check("below minimum snaps", await value("cap-you-amount"), "$50,000");

console.log(failures ? `${failures} failures` : `All ${golden.steps.length} positions match the golden values`);
await browser.close();
process.exit(failures ? 1 : 0);
