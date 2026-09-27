import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { getPageDef, getSectionDef } from '@/content/registry';
import { requireAdmin } from '@/server/auth/session';
import { allPagesStatus, recentPublishes } from '@/server/content-admin';
import { newInquiryCount, recentNewInquiries, typeLabel } from '@/server/inquiries-admin';
import { getSettings } from '@/server/settings';

export const metadata: Metadata = { title: 'Dashboard' };

const linkClass = 'text-sm font-medium text-fg underline underline-offset-4 hover:text-fg-muted';

export default async function DashboardPage() {
  const { user } = await requireAdmin();
  const [settings, newCount, inquiries, publishes, pages] = await Promise.all([
    getSettings(),
    newInquiryCount(),
    recentNewInquiries(5),
    recentPublishes(5),
    allPagesStatus(),
  ]);
  const firstName = user.name.split(' ')[0];
  const toReview = pages.reduce((sum, page) => sum + page.needsReview, 0);

  return (
    <div className="space-y-8">
      <PageHeader title={firstName ? `Welcome, ${firstName}` : 'Welcome'} description="What is new on the Opero site." />

      {settings.maintenanceMode ? (
        <Notice tone="warning" title="Maintenance mode is on">
          Visitors see the holding page; you can still browse the site while signed in.{' '}
          <Link href="/admin/settings" className="font-medium text-fg underline underline-offset-4">
            Turn it off in Settings
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
            description={newCount ? `${newCount === 1 ? 'One inquiry is' : `${newCount} inquiries are`} waiting for a reply.` : 'Nothing is waiting for a reply.'}
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
                  title={`${row.name}, ${row.firm}`}
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
      </div>
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
