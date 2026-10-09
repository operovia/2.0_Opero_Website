import { sha256 } from '@/server/crypto';

/*
 * What the site keeps about a page view, worked out from the request before
 * anything is stored (src/server/visits.ts records it): whether the browser
 * is a crawler, what kind of device it is, where the visit came from, and a
 * code that stands in for the visitor. The code is a hash of the day, the
 * network address and the browser with a secret salt, so visitors can be
 * counted once a day without the address ever being kept, and no code links
 * one day to the next. Pure functions, so the unit tests cover them.
 */

/** Page views are kept this long, then deleted. The privacy notice says so. */
export const VISIT_RETENTION_DAYS = 180;

/** The owner's time zone: days on the Visitors page start at midnight here. Operovia is in Michigan. */
export const OWNER_TIME_ZONE = 'America/Detroit';

export const VISIT_KINDS = ['public', 'guest'] as const;
export type VisitKind = (typeof VISIT_KINDS)[number];

export const VISIT_DEVICES = ['desktop', 'mobile'] as const;
export type VisitDevice = (typeof VISIT_DEVICES)[number];

/** Crawlers, link previews, monitors and scripts, by the names they give themselves. An empty name counts as one too. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|fetch|scan|monitor|uptime|headless|preview|lighthouse|pagespeed|pingdom|python|curl\/|wget\/|java\/|httpclient|okhttp|go-http|node-fetch|axios|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|quora|pinterest|linkedinbot|twitterbot|bingpreview|yandex|baidu|duckduck|semrush|ahrefs|mj12|dataforseo|petalbot|applebot|google/i;

/** Whether the browser names itself as a crawler, a link preview or a script rather than a person's browser. */
export function isBot(userAgent: string): boolean {
  const name = userAgent.trim();
  return name === '' || BOT_PATTERN.test(name);
}

/** A phone or tablet, or a desktop browser, from the user agent. */
export function deviceOf(userAgent: string): VisitDevice {
  return /\b(iphone|ipad|ipod|android|mobile|windows phone|blackberry|opera mini)\b/i.test(userAgent) ? 'mobile' : 'desktop';
}

/** A host name without its port or a leading www, lowercase; '' for nothing usable. */
export function plainHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

/**
 * The site a visit came from, as the Referer header gives it: its host name
 * alone, never the page. Empty for a direct visit, an unreadable header, or
 * a link from this site itself (its own hosts, as given).
 */
export function referrerHost(referer: string | null | undefined, ownHosts: readonly string[]): string {
  if (!referer) return '';
  let host = '';
  try {
    host = plainHost(new URL(referer).hostname);
  } catch {
    return '';
  }
  if (!host) return '';
  const own = ownHosts.map(plainHost).filter(Boolean);
  return own.includes(host) ? '' : host.slice(0, 200);
}

/** The day a visit falls on for the visitor code: the UTC date, which is the same on every server. */
export function visitDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/**
 * The code that stands in for a visitor for one day: a hash of a secret
 * salt, the day, the network address and the browser. The same person reads
 * the same all day and differently tomorrow; without the salt, nobody can
 * work back from the code to the address.
 */
export function visitorCode(salt: string, day: string, ip: string, userAgent: string): string {
  return sha256(`${salt}\n${day}\n${ip.trim()}\n${userAgent.trim()}`).slice(0, 32);
}

/** The request headers a hosting platform may use to say which country a request came from, in the order they are tried. */
export const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country', 'x-country-code', 'x-appengine-country'] as const;

/** A two-letter country code from one of those headers, uppercase, or '' when none says. */
export function countryFrom(read: (name: string) => string | null | undefined): string {
  for (const name of COUNTRY_HEADERS) {
    const value = (read(name) ?? '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'T1') return value;
  }
  return '';
}

export type DailyVisits = { day: string; views: number; visitors: number; guests: number; bots: number };

/**
 * The last `days` days as a run with no gaps, newest first, with zeros for
 * days nothing was recorded, so the table on the Visitors page reads as a
 * calendar. `today` is the first day, as YYYY-MM-DD in the owner's zone.
 */
export function fillDays(rows: readonly DailyVisits[], today: string, days: number): DailyVisits[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const out: DailyVisits[] = [];
  const cursor = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < days; i += 1) {
    const day = cursor.toISOString().slice(0, 10);
    out.push(byDay.get(day) ?? { day, views: 0, visitors: 0, guests: 0, bots: 0 });
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out;
}

/** Today's date as YYYY-MM-DD in the owner's time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
