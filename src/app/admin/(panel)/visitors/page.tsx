import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { OWNER_TIME_ZONE, todayIn, VISIT_RETENTION_DAYS } from '@/lib/visits';
import { requireAdmin } from '@/server/auth/session';
import { dailyVisits, recentVisits, topPages, topReferrers, visitPageLabel, visitSummary, type VisitTotals } from '@/server/visits';

export const metadata: Metadata = { title: 'Visitors' };

const n = (value: number) => value.toLocaleString('en-US');
const count = (value: number, one: string, many: string) => `${n(value)} ${value === 1 ? one : many}`;

/** "12 views, 7 visitors, 2 by guests" for a period, or that nobody came. */
function visitLine(totals: VisitTotals): string {
  if (!totals.views) return 'No visits.';
  const parts = [count(totals.views, 'view', 'views'), count(totals.visitors, 'visitor', 'visitors')];
  if (totals.guests) parts.push(`${n(totals.guests)} by guests`);
  return parts.join(', ');
}

/** A day as the table names it: Today, or Thu, Oct 8. */
function dayLabel(day: string, today: string): string {
  if (day === today) return 'Today';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
}

const deviceLabel = { desktop: 'Desktop', mobile: 'Phone or tablet' } as const;

export default async function VisitorsPage() {
  await requireAdmin();
  const [summary, days, pages, referrers, recent] = await Promise.all([visitSummary(), dailyVisits(30), topPages(), topReferrers(), recentVisits(100)]);
  const today = todayIn(OWNER_TIME_ZONE);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visitors"
        description={`Who comes to the site: every page view by the public and by guests, with crawlers and your own visits left out. A visitor is counted once a day, by a code that changes daily, and no address is kept. Records are deleted after ${VISIT_RETENTION_DAYS} days.`}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="At a glance" description="Days start at midnight in Michigan." />
          <dl className="divide-y divide-line">
            <Row label="Today">{visitLine(summary.today)}</Row>
            <Row label="Last 7 days">{visitLine(summary.week)}</Row>
            <Row label="Last 30 days">{visitLine(summary.month)}</Row>
            <Row label="Crawlers">
              {summary.botsWeek
                ? `${count(summary.botsWeek, 'visit', 'visits')} by search engines, link previews and scripts in the last 7 days, left out of the counts above.`
                : 'None in the last 7 days.'}
            </Row>
            <Row label="Last visit">
              {summary.latestAt ? <Time value={summary.latestAt} format="relative" /> : 'Nobody has visited since the site started counting.'}
            </Row>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Pages" description="What people viewed in the last 30 days, most viewed first." />
          {pages.length ? (
            <ul className="divide-y divide-line">
              {pages.map((page) => (
                <li key={page.path} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{visitPageLabel(page.path)}</p>
                    <p className="truncate text-sm text-fg-subtle">{page.path}</p>
                  </div>
                  <p className="text-sm text-fg-muted tabular-nums sm:text-right">
                    {count(page.views, 'view', 'views')}, {count(page.visitors, 'visitor', 'visitors')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-fg-muted">Nothing viewed in the last 30 days.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Where visits came from"
            description="The sites people followed a link from in the last 30 days. Direct visits, and the site's own links, are not listed."
          />
          {referrers.length ? (
            <ul className="divide-y divide-line">
              {referrers.map((row) => (
                <li key={row.referrer} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-6 py-3.5">
                  <p className="truncate font-medium text-fg">{row.referrer}</p>
                  <p className="text-sm text-fg-muted tabular-nums sm:text-right">
                    {count(row.views, 'view', 'views')}, {count(row.visitors, 'visitor', 'visitors')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-fg-muted">Direct visits only so far: nobody has followed a link here from another site.</p>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="By day" description="The last 30 days, newest first." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-fg-muted">
                  <th scope="col" className="px-6 py-3 font-medium">
                    Day
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Views
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Visitors
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    By guests
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">
                    Crawlers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {days.map((row) => (
                  <tr key={row.day} className={row.views ? 'text-fg' : 'text-fg-subtle'}>
                    <th scope="row" className="px-6 py-2.5 text-left font-medium whitespace-nowrap">
                      {dayLabel(row.day, today)}
                    </th>
                    <td className="px-3 py-2.5 text-right tabular-nums">{n(row.views)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{n(row.visitors)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{n(row.guests)}</td>
                    <td className="px-6 py-2.5 text-right tabular-nums text-fg-subtle">{n(row.bots)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Latest visits" description="The last 100 page views by people, newest first." />
        {recent.length ? (
          <ul className="divide-y divide-line">
            {recent.map((visit) => (
              <li key={visit.id} className="grid grid-cols-1 gap-1 px-6 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
                <div className="min-w-0">
                  <p className="text-sm text-fg">
                    <span className="font-medium">{visit.kind === 'guest' ? visit.email || 'A guest' : 'Someone'}</span>{' '}
                    <span className="text-fg-muted">viewed</span> <span className="font-medium">{visitPageLabel(visit.path)}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-fg-subtle">
                    {[
                      visit.kind === 'guest' ? 'Guest' : 'Public',
                      visit.referrer ? `from ${visit.referrer}` : 'direct',
                      deviceLabel[visit.device],
                      visit.country || null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <p className="text-sm text-fg-subtle sm:text-right">
                  <Time value={visit.at} />
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-5 text-sm text-fg-muted">
            No visits recorded yet. They appear here as people open the site; your own visits while signed in are left out.
          </p>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-fg">{label}</dt>
      <dd className="min-w-0 text-sm text-fg-muted">{children}</dd>
    </div>
  );
}
