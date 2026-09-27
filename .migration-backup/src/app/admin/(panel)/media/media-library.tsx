'use client';

import { Check, CircleAlert, CircleCheck, Copy, ExternalLink, ImageUp, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type DragEvent as ReactDragEvent } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { EmptyState } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { cn } from '@/lib/cn';
import { ACCEPTED_IMAGE_TYPES, formatBytes, MAX_UPLOAD_BYTES, UPLOAD_RULES } from '@/lib/media';
import { deleteMediaAction } from './actions';

export type LibraryItem = {
  id: string;
  url: string;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploadedBy: string | null;
  usedIn: string[];
};

type Upload = { id: number; name: string; status: 'waiting' | 'uploading' | 'done' | 'error'; error?: string };

const SOCIAL = 'Social share image';

/** Sends one file to the upload route. Returns an error message, or null when it worked. */
async function send(file: File): Promise<string | null> {
  if (file.type === 'image/heic' || file.type === 'image/heif') return 'Photos in HEIC format need to be exported as JPEG first.';
  if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Upload a JPEG, PNG, WebP, GIF, or AVIF image.';
  if (file.size > MAX_UPLOAD_BYTES) return 'Images can be up to 8 MB.';
  const body = new FormData();
  body.append('file', file);
  try {
    const response = await fetch('/admin/media/upload', { method: 'POST', body, redirect: 'manual' });
    if (response.type === 'opaqueredirect' || response.status === 401) return 'Your session has ended. Reload the page to sign in again.';
    if (response.ok) return null;
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? 'The upload did not finish. Try again.';
  } catch {
    return 'The upload did not finish. Check your connection and try again.';
  }
}

function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

export function MediaLibrary({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [deleting, startDelete] = useTransition();

  // A file dropped anywhere else on the page would otherwise replace the admin with the image.
  useEffect(() => {
    const stop = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
    };
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  const setStatus = (id: number, status: Upload['status'], error?: string) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, status, error } : u)));

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setNotice(null);
    const batch: Upload[] = files.map((file) => ({ id: nextId.current++, name: file.name, status: 'waiting' }));
    setUploads((list) => [...list.filter((u) => u.status === 'waiting' || u.status === 'uploading'), ...batch]);
    for (const [index, file] of files.entries()) {
      const { id } = batch[index]!;
      setStatus(id, 'uploading');
      const error = await send(file);
      setStatus(id, error ? 'error' : 'done', error ?? undefined);
      if (!error) router.refresh();
    }
  };

  const onDrag = (event: ReactDragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    setDragging(true);
  };

  const remove = (item: LibraryItem) => {
    const links = item.usedIn.filter((use) => use !== SOCIAL);
    const warnings = [
      item.usedIn.includes(SOCIAL) ? 'It is the social share image. Shares will use the generated image until you choose another in Settings.' : '',
      links.length ? `It is linked from ${links.join(', ')}. Those links will stop working.` : '',
    ].filter(Boolean);
    if (!window.confirm([`Delete ${item.filename}? This cannot be undone.`, ...warnings].join('\n\n'))) return;
    startDelete(async () => {
      const result = await deleteMediaAction(item.id);
      setNotice(result);
      noticeRef.current?.focus();
    });
  };

  const active = uploads.filter((u) => u.status === 'waiting' || u.status === 'uploading').length;
  const done = uploads.filter((u) => u.status === 'done').length;
  const failed = uploads.filter((u) => u.status === 'error').length;
  const summary = active
    ? `Uploading ${plural(active, 'image')}.`
    : uploads.length
      ? [done ? `${plural(done, 'image')} uploaded.` : '', failed ? `${plural(failed, 'image')} could not be uploaded.` : ''].filter(Boolean).join(' ')
      : '';

  return (
    <div className="space-y-8">
      <div
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload([...event.dataTransfer.files]);
        }}
        className={cn(
          'flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150',
          dragging ? 'border-focus-ring bg-accent-soft' : 'border-line-strong bg-surface',
        )}
      >
        <ImageUp className="size-8 text-fg-subtle" aria-hidden />
        <div>
          <p className="font-medium text-fg">Drag images here to upload them</p>
          <p className="mt-1 text-sm text-fg-muted">
            {UPLOAD_RULES} For the social share image, use 1200 × 630 pixels.
          </p>
        </div>
        <Button onClick={() => input.current?.click()}>Choose images</Button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          hidden
          onChange={(event) => {
            void upload([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
      </div>

      <div aria-live="polite" className={cn(!uploads.length && 'sr-only')}>
        {uploads.length ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-fg">{summary}</p>
              {!active ? (
                <Button variant="ghost" size="sm" onClick={() => setUploads([])}>
                  Clear list
                </Button>
              ) : null}
            </div>
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  {u.status === 'done' ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  ) : u.status === 'error' ? (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <LoaderCircle className={cn('mt-0.5 size-4 shrink-0 text-fg-subtle', u.status === 'uploading' && 'spin')} aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{u.name}</p>
                    <p className={u.status === 'error' ? 'text-danger' : 'text-fg-muted'}>
                      {u.status === 'waiting' ? 'Waiting' : u.status === 'uploading' ? 'Uploading' : u.status === 'done' ? 'Uploaded' : u.error}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div ref={noticeRef} tabIndex={-1} className="outline-none">
        {notice ? <Notice tone={notice.ok ? 'success' : 'danger'}>{notice.message}</Notice> : null}
      </div>

      {items.length ? (
        <section aria-labelledby="library-title" className="space-y-4">
          <h2 id="library-title" className="text-base font-semibold text-fg">
            {plural(items.length, 'image')}
          </h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onDelete={() => remove(item)} deleting={deleting} />
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState title="No images yet">Images you upload appear here, ready to link to or to use as the social share image.</EmptyState>
      )}
    </div>
  );
}

function MediaCard({ item, onDelete, deleting }: { item: LibraryItem; onDelete: () => void; deleting: boolean }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="media-thumb relative aspect-[4/3] border-b border-line">
        <Image src={item.url} alt="" fill sizes="(min-width: 1280px) 24rem, (min-width: 640px) 45vw, 100vw" className="object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-fg" title={item.filename}>
            {item.filename}
          </p>
          <p className="text-sm text-fg-muted">
            {item.width && item.height ? `${item.width} × ${item.height} · ` : ''}
            {formatBytes(item.size)}
          </p>
          <p className="text-xs text-fg-subtle">
            Uploaded <Time value={item.createdAt} format="date" />
            {item.uploadedBy ? ` by ${item.uploadedBy}` : ''}
          </p>
        </div>
        {item.usedIn.length ? (
          <p className="flex items-start gap-1.5 text-xs text-fg-muted">
            <CircleCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden />
            <span>In use: {item.usedIn.join('; ')}</span>
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <CopyUrlButton url={item.url} filename={item.filename} />
          <a href={item.url} target="_blank" rel="noreferrer" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            <ExternalLink className="size-4" aria-hidden />
            Open<span className="sr-only"> {item.filename} (opens in a new tab)</span>
          </a>
          <Button variant="ghost-danger" size="icon" onClick={onDelete} disabled={deleting} title="Delete" className="ml-auto">
            <Trash2 className="size-4" aria-hidden />
            <span className="sr-only">Delete {item.filename}</span>
          </Button>
        </div>
      </div>
    </li>
  );
}

function CopyUrlButton({ url, filename }: { url: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const href = new URL(url, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      // Clipboard access needs a secure page; offer the address to copy by hand instead.
      window.prompt('Copy this address:', href);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy URL'}
        <span className="sr-only"> of {filename}</span>
      </Button>
      <span role="status" className="sr-only">
        {copied ? 'Address copied' : ''}
      </span>
    </>
  );
}
