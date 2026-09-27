import { count, desc, inArray } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { db } from '@/db/client';
import { auditLog } from '@/db/schema';
import { cn } from '@/lib/cn';
import type { AuditAction } from '@/server/audit';
import { auditFilters, auditLabels, type AuditFilter } from '@/server/audit-labels';
import { requireAdmin } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Activity' };

const PAGE_SIZE = 50;

function describe(details: Record<string, unknown>): string {
  if (Array.isArray(details.changed) && details.changed.length) return `Changed: ${details.changed.join(', ')}`;
  if (typeof details.email === 'string') return details.email;
  if (details.resent) return 'Resent';
  if (typeof details.note === 'string') return details.note;
  return '';
}

export default async function ActivityPage({ searchParams }: PageProps<'/admin/activity'>) {
  await requireAdmin();
  const params = await searchParams;
  const filter: AuditFilter = typeof params.type === 'string' && params.type in auditFilters ? (params.type as AuditFilter) : 'all';
  const page = Math.max(1, Number(params.page) || 1);
  const actions = auditFilters[filter].actions;
  const where = actions ? inArray(auditLog.action, [...actions]) : undefined;

  const [entries, [total]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(auditLog).where(where),
  ]);
  const pages = Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE));
  const href = (next: { type?: AuditFilter; page?: number }) => {
    const query = new URLSearchParams();
    const type = next.type ?? filter;
    if (type !== 'all') query.set('type', type);
    if ((next.page ?? 1) > 1) query.set('page', String(next.page));
    const qs = query.toString();
    return qs ? `/admin/activity?${qs}` : '/admin/activity';
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Activity" description="A record of sign-ins, publishes, and changes made in the admin." />

      <nav aria-label="Filter activity" className="flex flex-wrap gap-2">
        {(Object.keys(auditFilters) as AuditFilter[]).map((key) => (
          <Link
            key={key}
            href={href({ type: key })}
            aria-current={key === filter ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium transition-colors duration-150',
              key === filter ? 'border-transparent bg-accent text-on-accent' : 'border-line-strong text-fg-muted hover:text-fg',
            )}
          >
            {auditFilters[key].label}
          </Link>
        ))}
      </nav>

      {entries.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {entries.map((entry) => {
              const detail = describe(entry.details);
              return (
                <li key={entry.id} className="grid gap-1 px-6 py-4 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div className="min-w-0">
                    <p className="text-sm text-fg">
                      <span className="font-medium">{entry.actorEmail || 'Unknown'}</span>{' '}
                      <span className="text-fg-muted">{auditLabels[entry.action as AuditAction] ?? entry.action}</span>
                      {entry.target ? <span className="text-fg"> {entry.target}</span> : null}
                    </p>
                    {detail ? <p className="mt-0.5 truncate text-sm text-fg-subtle">{detail}</p> : null}
                  </div>
                  <p className="text-sm text-fg-subtle sm:text-right">
                    <Time value={entry.createdAt} />
                    {entry.ip ? <span className="block text-xs">{entry.ip}</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState title="Nothing here yet">Activity appears as people sign in and make changes.</EmptyState>
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
