'use client';

import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { discardDraftAction, publishAction, rollbackAction, saveDraftAction, type EditorResult } from '@/app/admin/(panel)/content/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Time } from '@/components/ui/time';
import type { Fields } from '@/content/fields';
import { cn } from '@/lib/cn';
import { FieldInput, type Errors } from './field-inputs';

export type VersionItem = { id: string; version: number; note: string; publishedAt: string; publishedBy: string | null };

type Props = {
  page: string;
  section: string;
  fields: Fields;
  draft: Record<string, unknown>;
  published: Record<string, unknown>;
  version: number;
  needsReview: boolean;
  previewPath: string;
  versions: VersionItem[];
};

type Values = Record<string, unknown>;

/* List items get a client-only key so reordering never mixes up their editors. */
const KEY = '__key';

function withKeys(values: Values, fields: Fields): Values {
  const next: Values = { ...values };
  for (const [name, field] of Object.entries(fields)) {
    if (field.kind === 'list' && Array.isArray(next[name])) {
      next[name] = (next[name] as Values[]).map((item) => (item[KEY] ? item : { ...item, [KEY]: crypto.randomUUID() }));
    }
  }
  return next;
}

function withoutKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => k !== KEY).map(([k, v]) => [k, withoutKeys(v)]));
  }
  return value;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((k) => k !== KEY)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Values)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function SectionEditor(props: Props) {
  const { page, section, fields, previewPath } = props;
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => withKeys(props.draft, fields));
  const [saved, setSaved] = useState(() => canonical(props.draft));
  const [published, setPublished] = useState(() => canonical(props.published));
  const [revision, setRevision] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<EditorResult | null>(null);
  const [pending, startTransition] = useTransition();

  const current = canonical(values);
  const unsaved = current !== saved;
  const differsFromLive = current !== published;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const handle = (action: () => Promise<EditorResult>, after?: (r: EditorResult) => void, replaceValues = false) =>
    startTransition(async () => {
      const r = await action();
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok && r.values) {
        const fresh = canonical(r.values);
        setSaved(fresh);
        if (replaceValues) {
          setValues(withKeys(r.values, fields));
          setRevision((n) => n + 1);
        }
      }
      after?.(r);
      router.refresh();
    });

  const payload = () => withoutKeys(values);

  const saveDraft = () => handle(() => saveDraftAction(page, section, payload()));
  const publish = () =>
    handle(
      () => publishAction(page, section, payload()),
      (r) => r.ok && r.values && setPublished(canonical(r.values)),
    );
  const preview = () => {
    // Open the tab now (browsers block pop-ups opened after an await), then save and point it at the preview.
    const tab = window.open('about:blank', '_blank');
    handle(
      () => saveDraftAction(page, section, payload()),
      (r) => {
        if (r.ok && tab) tab.location.href = `/api/preview?path=${encodeURIComponent(previewPath)}`;
        else tab?.close();
      },
    );
  };
  const discard = () => {
    if (!window.confirm('Discard your changes and go back to the live version of this section?')) return;
    handle(() => discardDraftAction(page, section), undefined, true);
  };
  const restore = (item: VersionItem) => {
    if (!window.confirm(`Make version ${item.version} live again? Your current draft of this section will be replaced.`)) return;
    handle(
      () => rollbackAction(page, section, item.id),
      (r) => r.ok && r.values && setPublished(canonical(r.values)),
      true,
    );
  };

  const status = useMemo(() => {
    if (unsaved) return <Badge tone="warning">Unsaved changes</Badge>;
    if (differsFromLive) return <Badge tone="warning">Draft not yet published</Badge>;
    return <Badge tone="success">Live version</Badge>;
  }, [unsaved, differsFromLive]);

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-6">
        {props.needsReview ? (
          <Notice tone="warning" title="Drafted copy, please review">
            This section was drafted for the site rather than taken from approved copy. Edit it as needed, then publish to clear this flag.
          </Notice>
        ) : null}
        {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}

        <Card>
          <CardHeader title="Content" actions={status} />
          <CardBody>
            <form
              key={revision}
              className="space-y-7"
              onSubmit={(e) => {
                e.preventDefault();
                saveDraft();
              }}
            >
              {Object.entries(fields).map(([name, field]) => (
                <FieldInput key={name} name={name} field={field} value={values[name]} onChange={(v) => setValues((prev) => ({ ...prev, [name]: v }))} errors={errors} />
              ))}
            </form>
          </CardBody>
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
            <Button variant="ghost" size="sm" onClick={discard} disabled={pending || !differsFromLive}>
              Discard changes
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={preview} disabled={pending}>
                <ExternalLink className="size-4" aria-hidden />
                Preview
              </Button>
              <Button variant="secondary" onClick={saveDraft} disabled={pending || !unsaved}>
                Save draft
              </Button>
              <Button onClick={publish} disabled={pending || (!differsFromLive && !props.needsReview)} aria-busy={pending || undefined}>
                {pending ? 'Working' : 'Publish'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <aside aria-label="Version history" className="space-y-4">
        <Card>
          <CardHeader title="History" description={`The last ${props.versions.length === 1 ? 'version' : `${props.versions.length} versions`} published. Up to twenty are kept.`} />
          <ol className="divide-y divide-line">
            {props.versions.map((item, i) => (
              <li key={item.id} className="px-6 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-fg">
                    Version {item.version}
                    {i === 0 ? <span className="ml-2 font-normal text-success">Live</span> : null}
                  </p>
                  {i > 0 ? (
                    <button type="button" onClick={() => restore(item)} disabled={pending} className="text-sm font-medium text-fg underline underline-offset-4 disabled:opacity-50">
                      Restore
                    </button>
                  ) : null}
                </div>
                <p className={cn('mt-0.5 text-xs text-fg-subtle')}>
                  <Time value={item.publishedAt} />
                  {item.publishedBy ? ` · ${item.publishedBy}` : ''}
                </p>
                {item.note ? <p className="mt-1 text-xs text-fg-muted">{item.note}</p> : null}
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}
