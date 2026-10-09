import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { allSections, getPageDef, getSectionDef } from '@/content/registry';
import { publishedSectionProblems } from '@/content/store';
import { requireAdmin } from '@/server/auth/session';
import { allPagesStatus, recentPublishes } from '@/server/content-admin';
import { databaseStatus } from '@/server/database-status';
import { emailConfig } from '@/server/env';
import { emailHealth, recentRequestErrors } from '@/server/health';
import { inquirerName, newInquiryCount, recentNewInquiries, typeLabel } from '@/server/inquiries-admin';
import { getSettings } from '@/server/settings';
import { surveysWithRecentResponses } from '@/server/surveys';
import { visitSummary, type VisitTotals } from '@/server/visits';

export const metadata: Metadata = { title: 'Dashboard' };

const linkClass = 'text-sm font-medium text-fg underline underline-offset-4 hover:text-fg-muted';

export default async function DashboardPage() {
  const { user } = await requireAdmin();
  const [settings, newCount, inquiries, publishes, pages, surveys, database, visits] = await Promise.all([
    getSettings(),
    newInquiryCount(),
    recentNewInquiries(5),
    recentPublishes(5),
    allPagesStatus(),
    surveysWithRecentResponses(30, 5),
    databaseStatus(),
    visitSummary(),
  ]);
  const errors = recentRequestErrors();
  // Sections whose figures are held back on the site until they are fixed, with the reasons.
  const withheld = (
    await Promise.all(
      allSections()
        .filter(({ def }) => def.withhold)
        .map(async ({ page, section: key, def }) => ({
          page,
          key,
          pageLabel: getPageDef(page)?.label ?? page,
          def,
          problems: await publishedSectionProblems(page, key),
        })),
    )
  ).filter((item) => item.problems.length);
  const email = emailHealth();
  const { apiKey, from } = emailConfig();
  const firstName = user.name.split(' ')[0];
  const toReview = pages.reduce((sum, page) => sum + page.needsReview, 0);

  return (
    <div className="space-y-8">
      <PageHeader title={firstName ? `Welcome, ${firstName}` : 'Welcome'} description="What is new on the Opero site." />

      {withheld.map(({ page, key, pageLabel, def, problems }) => (
        <Notice key={`${page}.${key}`} tone="danger" title={def.withhold}>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {problems.map((problem, i) => (
              <li key={i}>
                {problem.label}: {problem.message}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            <Link href={`/admin/content/${page}/${key}`} className="font-medium text-fg underline underline-offset-4">
              Fix them in Content, {pageLabel}, {def.label}
            </Link>
            .
          </p>
        </Notice>
      ))}

      {settings.maintenanceMode ? (
        <Notice tone="warning" title="Maintenance mode is on">
          Visitors see the holding page; you can still browse the site while signed in.{' '}
          <Link href="/admin/settings" className="font-medium text-fg underline underline-offset-4">
            Turn it off in Settings
          </Link>
          .
        </Notice>
      ) : null}

      {settings.privateSite ? (
        <Notice title="The site is private">
          Only people on the guest list, and you on any browser where you are signed in, can see it; everyone else meets the front door.{' '}
          <Link href="/admin/guests" className="font-medium text-fg underline underline-offset-4">
            Guests
          </Link>
          {' or '}
          <Link href="/admin/settings" className="font-medium text-fg underline underline-offset-4">
            Settings
          </Link>
          .
        </Notice>
      ) : null}

      {toReview ? (
        <Notice title="Drafted copy to review">
          {toReview === 1 ? 'One section was' : `${toReview} sections were`} drafted for the site rather than taken from approved copy.{' '}
          <Link href="/admin/content" className="font-medium text-fg underline underline-offset-4">
            Review content
          </Link>
          .
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="New inquiries"
            description={
              newCount ? `${newCount === 1 ? 'One inquiry is' : `${newCount} inquiries are`} waiting for a reply.` : 'Nothing is waiting for a reply.'
            }
            actions={
              <Link href="/admin/inquiries" className={linkClass}>
                All inquiries
              </Link>
            }
          />
          {inquiries.length ? (
            <ul className="divide-y divide-line">
              {inquiries.map((row) => (
                <Row
                  key={row.id}
                  href={`/admin/inquiries/${row.id}`}
                  title={inquirerName(row)}
                  detail={typeLabel(row.type, settings.partnerProgramLabel)}
                  time={row.createdAt}
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-fg-muted">Demo requests and partner applications appear here as they arrive.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Visitors"
            description="People on the site, with crawlers and your own visits left out. A visitor is counted once a day."
            actions={
              <Link href="/admin/visitors" className={linkClass}>
                All visitors
              </Link>
            }
          />
          <dl className="divide-y divide-line">
            <HealthRow label="Today">{visitLine(visits.today)}</HealthRow>
            <HealthRow label="Last 7 days">{visitLine(visits.week)}</HealthRow>
            <HealthRow label="Last 30 days">{visitLine(visits.month)}</HealthRow>
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Survey responses"
            description="Surveys that received responses in the last 30 days."
            actions={
              <Link href="/admin/surveys" className={linkClass}>
                All surveys
              </Link>
            }
          />
          {surveys.length ? (
            <ul className="divide-y divide-line">
              {surveys.map((survey) => (
                <Row
                  key={survey.id}
                  href={`/admin/surveys/${survey.id}/results`}
                  title={survey.title}
                  detail={`${survey.recent.toLocaleString('en-US')} ${survey.recent === 1 ? 'response' : 'responses'} in the last 30 days`}
                  time={survey.lastResponseAt}
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-fg-muted">No survey responses in the last 30 days.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent publishes"
            description="The latest changes made live on the site."
            actions={
              <Link href="/admin/content" className={linkClass}>
                All content
              </Link>
            }
          />
          {publishes.length ? (
            <ul className="divide-y divide-line">
              {publishes.map((item) => (
                <Row
                  key={`${item.page}.${item.section}.${item.version}`}
                  href={`/admin/content/${item.page}/${item.section}`}
                  title={`${getPageDef(item.page)?.label ?? item.page}: ${getSectionDef(item.page, item.section)?.label ?? item.section}`}
                  detail={[`Version ${item.version}`, item.note, item.publisherName || item.publisherEmail].filter(Boolean).join(' · ')}
                  time={item.publishedAt}
                />
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-fg-muted">Nothing has been published from the admin yet. Changes appear here once you publish them.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Site health" description="What this server knows about itself since it started." />
          <dl className="divide-y divide-line">
            <HealthRow label="Database">
              {database.unreachable
                ? `Did not answer: ${database.unreachable}`
                : database.pending.length
                  ? `${database.pending.length === 1 ? 'One update is' : `${database.pending.length} updates are`} waiting: ${database.pending.join(', ')}.`
                  : 'Up to date.'}
              {database.report ? (
                database.report.ok ? (
                  <>
                    {' '}
                    Last prepared <Time value={database.report.at} format="relative" />
                    {database.report.repaired.length
                      ? `, applying ${database.report.repaired.length === 1 ? 'one update' : `${database.report.repaired.length} updates`} it did not have: ${database.report.repaired.join(', ')}.`
                      : '.'}
                  </>
                ) : (
                  <>
                    {' '}
                    The last attempt, <Time value={database.report.at} format="relative" />, failed: {database.report.message}
                  </>
                )
              ) : (
                ' This server has not prepared it yet.'
              )}
            </HealthRow>
            <HealthRow label="Email">
              {apiKey ? (
                <>
                  Sending as {from}.{' '}
                  {email.lastSentAt ? (
                    <>
                      Last sent <Time value={email.lastSentAt} format="relative" />.
                    </>
                  ) : (
                    'Nothing sent yet.'
                  )}
                </>
              ) : (
                'Not set up: RESEND_API_KEY is missing, so emails are written to the server log instead of being sent.'
              )}
              {email.failures.length ? (
                <ul className="mt-2 space-y-2">
                  {email.failures.map((failure, index) => (
                    <li key={index}>
                      <p className="text-fg">
                        Not sent <Time value={failure.at} format="relative" />, to {failure.to}: {failure.subject}
                      </p>
                      <p className="break-words">{failure.message}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </HealthRow>
            <HealthRow label="Page errors">
              {errors.length ? (
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index}>
                      <p className="text-fg">
                        <Time value={error.at} format="relative" />, {error.path}
                        {error.digest ? ` (reference ${error.digest})` : ''}
                      </p>
                      <p className="break-words">{error.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                'None recorded.'
              )}
            </HealthRow>
          </dl>
        </Card>
      </div>
    </div>
  );
}

const n = (value: number) => value.toLocaleString('en-US');

/** "12 views, 7 visitors, 2 by guests" for a period, or that nobody came. */
function visitLine(totals: VisitTotals): string {
  if (!totals.views) return 'No visits.';
  const parts = [`${n(totals.views)} ${totals.views === 1 ? 'view' : 'views'}`, `${n(totals.visitors)} ${totals.visitors === 1 ? 'visitor' : 'visitors'}`];
  if (totals.guests) parts.push(`${n(totals.guests)} by guests`);
  return parts.join(', ');
}

function HealthRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-fg">{label}</dt>
      <dd className="min-w-0 text-sm text-fg-muted">{children}</dd>
    </div>
  );
}

function Row({ href, title, detail, time }: { href: string; title: ReactNode; detail: ReactNode; time: Date }) {
  return (
    <li className="last:*:rounded-b-xl">
      <Link href={href} className="grid grid-cols-1 gap-1 px-6 py-3.5 hover:bg-accent-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{title}</p>
          <p className="truncate text-sm text-fg-muted">{detail}</p>
        </div>
        <p className="text-sm text-fg-subtle sm:text-right">
          <Time value={time} format="relative" />
        </p>
      </Link>
    </li>
  );
}
