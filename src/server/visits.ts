import 'server-only';
import { desc, eq, gte, lt, max, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { db } from '@/db/client';
import { pageViews } from '@/db/schema';
import {
  countryFrom,
  deviceOf,
  fillDays,
  isBot,
  OWNER_TIME_ZONE,
  referrerHost,
  todayIn,
  VISIT_RETENTION_DAYS,
  visitDay,
  visitorCode,
  type DailyVisits,
  type VisitDevice,
  type VisitKind,
} from '@/lib/visits';
import { sha256 } from '@/server/crypto';
import { getAccess } from '@/server/entry';
import { siteUrl } from '@/server/env';
import { getGuest } from '@/server/guests';
import { clientIp, userAgent } from '@/server/request';

/*
 * Visits: who comes to the site, now that it is public. Every public page
 * notes its view here; the Dashboard's Visitors card and the Visitors page
 * read the counts. The record is worked out from the request while the page
 * renders and written once the answer is on its way (after()), so a visitor
 * never waits on the database, and a database that is down never costs a
 * page. Admins' own visits are left out. What is kept, and for how long, is
 * in src/lib/visits.ts and in the privacy notice.
 */

let cachedSalt: string | null = null;

/**
 * The secret salt in every visitor code. Derived from the database address,
 * which every server instance shares and nothing else sees, so the codes
 * agree across instances and cannot be worked back to an address.
 */
function salt(): string {
  cachedSalt ??= sha256(`opero-visits:${process.env.DATABASE_URL ?? ''}`);
  return cachedSalt;
}

type NewView = {
  path: string;
  referrer: string;
  visitor: string;
  kind: VisitKind;
  inviteId: string | null;
  email: string;
  device: VisitDevice;
  country: string;
  bot: boolean;
};

/** Writes the view, and now and then clears views older than the retention. Never throws. */
async function store(view: NewView): Promise<void> {
  try {
    await db.insert(pageViews).values(view);
    if (Math.random() < 0.01) {
      await db.delete(pageViews).where(lt(pageViews.createdAt, sql`now() - make_interval(days => ${VISIT_RETENTION_DAYS})`));
    }
  } catch (error) {
    console.error('[opero] Could not record a visit', error);
  }
}

/**
 * Notes that the page at `path` was viewed, from a page's render: once per
 * request, after the gate has let the visitor through. Call it with the
 * page's own path, never anything from the request, so a query string with
 * a personal link's secret is never kept.
 */
export async function noteVisit(path: string): Promise<void> {
  // Outside the catch below: Next signals that a route is dynamic by throwing from headers() and cookies() during a build, and that must pass through.
  const [access, h] = await Promise.all([getAccess(), headers()]);
  // The owner's own visits, and the site seen as a visitor would see it, are never counted.
  if (access.admin) return;
  const [ip, agent, guest] = await Promise.all([clientIp(), userAgent(), getGuest()]);
  try {
    const ownHosts = [h.get('x-forwarded-host')?.split(',')[0] ?? '', h.get('host') ?? '', new URL(siteUrl()).host];
    const view: NewView = {
      path,
      referrer: referrerHost(h.get('referer'), ownHosts),
      visitor: visitorCode(salt(), visitDay(new Date()), ip, agent),
      kind: guest ? 'guest' : 'public',
      inviteId: guest?.inviteId ?? null,
      email: guest?.email ?? '',
      device: deviceOf(agent),
      country: countryFrom((name) => h.get(name)),
      bot: isBot(agent),
    };
    after(() => store(view));
  } catch (error) {
    console.error('[opero] Could not note a visit', error);
  }
}

/* --------------------------------------------------------------- reading */

export type VisitTotals = { views: number; visitors: number; guests: number };
export type VisitSummary = {
  today: VisitTotals;
  /** Today and the six days before it. */
  week: VisitTotals;
  /** Today and the twenty-nine days before it. */
  month: VisitTotals;
  /** Views by crawlers, link previews and scripts in the last seven days, kept out of the totals above. */
  botsWeek: number;
  /** When a person last viewed a page, or null before the first. */
  latestAt: Date | null;
};

// A literal rather than a parameter, so the day expression reads the same in SELECT and GROUP BY; the zone is a constant from code.
const zone = sql.raw(`'${OWNER_TIME_ZONE}'`);
/** Midnight today in the owner's time zone, as a moment. */
const todayStart = sql`(date_trunc('day', now() at time zone ${zone}) at time zone ${zone})`;
const weekStart = sql`(${todayStart} - interval '6 days')`;
const monthStart = sql`(${todayStart} - interval '29 days')`;
const human = sql`${pageViews.bot} = false`;
const asGuest = sql`${pageViews.kind} = 'guest'`;

/** How many views, visitors and guest visits since a moment, people only. */
const totals = (since: ReturnType<typeof sql>) => ({
  views: sql<number>`count(*) filter (where ${human} and ${pageViews.createdAt} >= ${since})::int`,
  visitors: sql<number>`count(distinct ${pageViews.visitor}) filter (where ${human} and ${pageViews.createdAt} >= ${since})::int`,
  guests: sql<number>`count(*) filter (where ${human} and ${asGuest} and ${pageViews.createdAt} >= ${since})::int`,
});

/** The counts for the Dashboard card and the head of the Visitors page. Visitors are counted once a day. */
export async function visitSummary(): Promise<VisitSummary> {
  const [row] = await db
    .select({
      todayViews: totals(todayStart).views,
      todayVisitors: totals(todayStart).visitors,
      todayGuests: totals(todayStart).guests,
      weekViews: totals(weekStart).views,
      weekVisitors: totals(weekStart).visitors,
      weekGuests: totals(weekStart).guests,
      monthViews: totals(monthStart).views,
      monthVisitors: totals(monthStart).visitors,
      monthGuests: totals(monthStart).guests,
      botsWeek: sql<number>`count(*) filter (where ${pageViews.bot} = true and ${pageViews.createdAt} >= ${weekStart})::int`,
      latestAt: max(pageViews.createdAt),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, monthStart));
  return {
    today: { views: row?.todayViews ?? 0, visitors: row?.todayVisitors ?? 0, guests: row?.todayGuests ?? 0 },
    week: { views: row?.weekViews ?? 0, visitors: row?.weekVisitors ?? 0, guests: row?.weekGuests ?? 0 },
    month: { views: row?.monthViews ?? 0, visitors: row?.monthVisitors ?? 0, guests: row?.monthGuests ?? 0 },
    botsWeek: row?.botsWeek ?? 0,
    latestAt: row?.latestAt ?? null,
  };
}

/** Day by day for the last `days` days in the owner's time zone, newest first, with zeros where nothing was recorded. */
export async function dailyVisits(days = 30): Promise<DailyVisits[]> {
  const day = sql<string>`to_char(${pageViews.createdAt} at time zone ${zone}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      day,
      views: sql<number>`count(*) filter (where ${human})::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitor}) filter (where ${human})::int`,
      guests: sql<number>`count(*) filter (where ${human} and ${asGuest})::int`,
      bots: sql<number>`count(*) filter (where ${pageViews.bot} = true)::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sql`(${todayStart} - make_interval(days => ${days - 1}))`))
    .groupBy(day)
    .orderBy(desc(day));
  return fillDays(rows, todayIn(OWNER_TIME_ZONE), days);
}

export type PageVisits = { path: string; views: number; visitors: number };

/** The pages people viewed in the last thirty days, most viewed first. */
export async function topPages(limit = 12): Promise<PageVisits[]> {
  return db
    .select({
      path: pageViews.path,
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitor})::int`,
    })
    .from(pageViews)
    .where(sql`${human} and ${pageViews.createdAt} >= ${monthStart}`)
    .groupBy(pageViews.path)
    .orderBy(desc(sql`count(*)`), pageViews.path)
    .limit(limit);
}

export type ReferrerVisits = { referrer: string; views: number; visitors: number };

/** The sites people came from in the last thirty days, most often first. Direct visits and the site's own links are not among them. */
export async function topReferrers(limit = 12): Promise<ReferrerVisits[]> {
  return db
    .select({
      referrer: pageViews.referrer,
      views: sql<number>`count(*)::int`,
      visitors: sql<number>`count(distinct ${pageViews.visitor})::int`,
    })
    .from(pageViews)
    .where(sql`${human} and ${pageViews.referrer} <> '' and ${pageViews.createdAt} >= ${monthStart}`)
    .groupBy(pageViews.referrer)
    .orderBy(desc(sql`count(*)`), pageViews.referrer)
    .limit(limit);
}

export type RecentVisit = {
  id: number;
  at: Date;
  path: string;
  kind: VisitKind;
  /** The guest's address, or '' for the public. */
  email: string;
  referrer: string;
  device: VisitDevice;
  country: string;
};

/** The latest page views by people, newest first. */
export async function recentVisits(limit = 100): Promise<RecentVisit[]> {
  return db
    .select({
      id: pageViews.id,
      at: pageViews.createdAt,
      path: pageViews.path,
      kind: pageViews.kind,
      email: pageViews.email,
      referrer: pageViews.referrer,
      device: pageViews.device,
      country: pageViews.country,
    })
    .from(pageViews)
    .where(eq(pageViews.bot, false))
    .orderBy(desc(pageViews.createdAt), desc(pageViews.id))
    .limit(limit);
}

/** The page's name on the Visitors page, from its path. */
export function visitPageLabel(path: string): string {
  const labels: Record<string, string> = {
    '/': 'Home',
    '/partners': 'Partners',
    '/founder': 'Founder',
    '/privacy': 'Privacy',
    '/data-room': 'Data Room: Founder',
    '/data-room/raise': 'Data Room: The Raise',
    '/data-room/cap-table': 'Data Room: Cap Table',
    '/data-room/files': 'Data Room: Documents',
  };
  return labels[path] ?? path;
}
