import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { cn } from '@/lib/cn';
import { requireAdmin } from '@/server/auth/session';
import {
  isInquiryStatus,
  isInquiryType,
  listInquiries,
  PAGE_SIZE,
  statusLabels,
  typeLabel,
  type InquiryStatus,
  type InquiryType,
} from '@/server/inquiries-admin';
import { getSettings } from '@/server/settings';

export const metadata: Metadata = { title: 'Inquiries' };

const statusTone = { new: 'accent', contacted: 'neutral', closed: 'neutral' } as const;

export default async function InquiriesPage({ searchParams }: PageProps<'/admin/inquiries'>) {
  await requireAdmin();
  const params = await searchParams;
  const type = isInquiryType(params.type) ? params.type : undefined;
  const status = isInquiryStatus(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const [{ rows, total }, settings] = await Promise.all([listInquiries({ type, status, page }), getSettings()]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (next: { type?: InquiryType | null; status?: InquiryStatus | null; page?: number }) => {
    const q = new URLSearchParams();
    const t = next.type === undefined ? type : next.type;
    const s = next.status === undefined ? status : next.status;
    if (t) q.set('type', t);
    if (s) q.set('status', s);
    if (next.page && next.page > 1) q.set('page', String(next.page));
    const qs = q.toString();
    return qs ? `/admin/inquiries?${qs}` : '/admin/inquiries';
  };

  const pill = (active: boolean) =>
    cn(
      'inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium transition-colors duration-150',
      active ? 'border-transparent bg-accent text-on-accent' : 'border-line-strong text-fg-muted hover:text-fg',
    );

  return (
    <div className="space-y-8">
      <PageHeader title="Inquiries" description="Demo requests and partner applications from the site, newest first." />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter by type" className="flex flex-wrap gap-2">
          <Link href={href({ type: null, page: 1 })} aria-current={!type ? 'page' : undefined} className={pill(!type)}>
            All
          </Link>
          <Link href={href({ type: 'demo', page: 1 })} aria-current={type === 'demo' ? 'page' : undefined} className={pill(type === 'demo')}>
            Demo requests
          </Link>
          <Link href={href({ type: 'partner', page: 1 })} aria-current={type === 'partner' ? 'page' : undefined} className={pill(type === 'partner')}>
            {typeLabel('partner', settings.partnerProgramLabel)}s
          </Link>
        </nav>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          <Link href={href({ status: null, page: 1 })} aria-current={!status ? 'page' : undefined} className={pill(!status)}>
            Any status
          </Link>
          {(Object.keys(statusLabels) as InquiryStatus[]).map((s) => (
            <Link key={s} href={href({ status: s, page: 1 })} aria-current={status === s ? 'page' : undefined} className={pill(status === s)}>
              {statusLabels[s]}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="first:*:rounded-t-xl last:*:rounded-b-xl">
                <Link href={`/admin/inquiries/${row.id}`} className="grid grid-cols-1 gap-1 px-6 py-4 hover:bg-accent-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className={cn('truncate text-fg', row.status === 'new' ? 'font-semibold' : 'font-medium')}>
                        {row.name}, {row.firm}
                      </span>
                      <Badge tone={statusTone[row.status]}>{statusLabels[row.status]}</Badge>
                    </p>
                    <p className="mt-1 truncate text-sm text-fg-muted">
                      {typeLabel(row.type, settings.partnerProgramLabel)}
                      {row.type === 'demo' && row.message ? ` · ${row.message}` : ''}
                      {row.type === 'partner' && row.role ? ` · ${row.role}` : ''}
                    </p>
                  </div>
                  <p className="text-sm text-fg-subtle sm:text-right">
                    <Time value={row.createdAt} format="relative" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState title={type || status ? 'Nothing matches these filters' : 'No inquiries yet'}>
          Demo requests and partner applications appear here as they arrive, and are emailed to the notification recipients in Settings.
        </EmptyState>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="font-medium text-fg underline underline-offset-4">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-fg-subtle">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="font-medium text-fg underline underline-offset-4">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
