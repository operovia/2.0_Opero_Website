'use client';

import { Check, Link2, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { EmptyState } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { cn } from '@/lib/cn';
import { removeRecipientAction, sendEmailsAction, type ActionResult } from '../../actions';

export type RecipientItem = {
  id: string;
  name: string;
  email: string;
  link: string;
  invitedAt: string | null;
  lastSentAt: string | null;
  remindedAt: string | null;
  openedAt: string | null;
  completedAt: string | null;
  sendCount: number;
};

type Filter = 'all' | 'not-invited' | 'waiting' | 'finished';

const filters: { key: Filter; label: string; match: (r: RecipientItem) => boolean }[] = [
  { key: 'all', label: 'Everyone', match: () => true },
  { key: 'not-invited', label: 'Not invited', match: (r) => !r.invitedAt && !r.completedAt },
  { key: 'waiting', label: 'Not finished', match: (r) => Boolean(r.invitedAt) && !r.completedAt },
  { key: 'finished', label: 'Finished', match: (r) => Boolean(r.completedAt) },
];

const PAGE = 100;

export function RecipientList({ surveyId, open, items }: { surveyId: string; open: boolean; items: RecipientItem[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const visible = items.filter(filters.find((f) => f.key === filter)!.match);

  const run = (work: () => Promise<ActionResult>) => startTransition(async () => setResult(await work()));

  return (
    <Card>
      <CardHeader
        title="People"
        description={items.length ? `${items.length.toLocaleString('en-US')} on the list. Opened means the person followed their link.` : undefined}
      />
      {items.length ? (
        <div className="space-y-4 px-6 pt-5">
          <nav aria-label="Filter people" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  setShown(PAGE);
                }}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium transition-colors duration-150',
                  filter === f.key ? 'border-transparent bg-accent text-on-accent' : 'border-line-strong text-fg-muted hover:text-fg',
                )}
              >
                {f.label} ({items.filter(f.match).length.toLocaleString('en-US')})
              </button>
            ))}
          </nav>
          {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}
        </div>
      ) : null}

      {items.length ? (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {visible.slice(0, shown).map((r) => (
            <li key={r.id} className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-fg">{r.name || r.email}</span>
                  <Status item={r} />
                </p>
                <p className="mt-0.5 truncate text-sm text-fg-muted">
                  {r.name ? `${r.email} · ` : ''}
                  <Progress item={r} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {!r.completedAt ? (
                  r.invitedAt ? (
                    <>
                      <Button variant="ghost" size="sm" disabled={pending || !open} onClick={() => run(() => sendEmailsAction(surveyId, 'remind', [r.id]))}>
                        Remind
                      </Button>
                      <Button variant="ghost" size="sm" disabled={pending || !open} onClick={() => run(() => sendEmailsAction(surveyId, 'invite', [r.id]))}>
                        Resend invitation
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" size="sm" disabled={pending || !open} onClick={() => run(() => sendEmailsAction(surveyId, 'invite', [r.id]))}>
                      Send invitation
                    </Button>
                  )
                ) : null}
                <CopyLink link={r.link} who={r.name || r.email} />
                <Button
                  variant="ghost-danger"
                  size="icon"
                  title="Remove"
                  disabled={pending}
                  onClick={() => {
                    const warning = r.completedAt ? ' Their response stays in the results.' : r.invitedAt ? ' Their link will stop working.' : '';
                    if (window.confirm(`Remove ${r.email} from the list?${warning}`)) run(() => removeRecipientAction(surveyId, r.id));
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Remove {r.email}</span>
                </Button>
              </div>
            </li>
          ))}
          {!visible.length ? <li className="px-6 py-8 text-center text-sm text-fg-muted">Nobody here.</li> : null}
        </ul>
      ) : (
        <div className="p-6">
          <EmptyState title="Nobody on the list yet">Add people above, then send the invitation. Each person gets their own link.</EmptyState>
        </div>
      )}
      {visible.length > shown ? (
        <div className="border-t border-line px-6 py-4">
          <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({(visible.length - shown).toLocaleString('en-US')} left)
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function Status({ item }: { item: RecipientItem }) {
  if (item.completedAt) return <Badge tone="success">Finished</Badge>;
  if (item.openedAt) return <Badge tone="warning">Opened</Badge>;
  if (item.invitedAt) return <Badge>Invited</Badge>;
  return <Badge>Not invited</Badge>;
}

function Progress({ item }: { item: RecipientItem }) {
  if (item.completedAt)
    return (
      <>
        Finished <Time value={item.completedAt} format="relative" />
      </>
    );
  if (!item.lastSentAt) return <>No email sent yet</>;
  return (
    <>
      {item.sendCount === 1 ? 'Emailed' : `Emailed ${item.sendCount} times, last`} <Time value={item.lastSentAt} format="relative" />
      {item.openedAt ? (
        <>
          {' '}
          · opened <Time value={item.openedAt} format="relative" />
        </>
      ) : null}
    </>
  );
}

function CopyLink({ link, who }: { link: string; who: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt('Copy this personal link:', link);
    }
  };
  return (
    <Button variant="ghost" size="icon" title={copied ? 'Copied' : 'Copy personal link'} onClick={copy}>
      {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      <span className="sr-only">{copied ? 'Link copied' : `Copy the personal link for ${who}`}</span>
    </Button>
  );
}
