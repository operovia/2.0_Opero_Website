'use client';

import { CircleAlert, CircleCheck, FileUp, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { DOCUMENT_ACCEPT, DOCUMENT_RULES, documentExtension, MAX_DOCUMENT_BYTES } from '@/lib/documents';

type Upload = { id: number; name: string; status: 'waiting' | 'uploading' | 'done' | 'error'; error?: string };

/** Sends one file to the upload route, into the folder. Returns an error message, or null when it worked. */
async function send(file: File, folderId: string | null): Promise<string | null> {
  if (!documentExtension(file.name)) return 'That kind of file is not accepted. Upload a PDF, Word, Excel, PowerPoint, CSV, text, image, or ZIP file.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Documents can be up to 25 MB.';
  const body = new FormData();
  body.append('file', file);
  if (folderId) body.append('folder', folderId);
  try {
    const response = await fetch('/admin/data-room/upload', { method: 'POST', body, redirect: 'manual' });
    if (response.type === 'opaqueredirect' || response.status === 401) return 'Your session has ended. Reload the page to sign in again.';
    if (response.ok) return null;
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? 'The upload did not finish. Try again.';
  } catch {
    return 'The upload did not finish. Check your connection and try again.';
  }
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/** The Data Room's upload control: documents dropped or chosen here go into the folder on screen, one after another. */
export function Uploader({ folderId, folderName }: { folderId: string | null; folderName: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);

  // A file dropped anywhere else on the page would otherwise replace the admin with the file.
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
    const batch: Upload[] = files.map((file) => ({ id: nextId.current++, name: file.name, status: 'waiting' }));
    setUploads((list) => [...list.filter((u) => u.status === 'waiting' || u.status === 'uploading'), ...batch]);
    for (const [index, file] of files.entries()) {
      const { id } = batch[index]!;
      setStatus(id, 'uploading');
      const error = await send(file, folderId);
      setStatus(id, error ? 'error' : 'done', error ?? undefined);
      if (!error) router.refresh();
    }
  };

  const onDrag = (event: ReactDragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    setDragging(true);
  };

  const active = uploads.filter((u) => u.status === 'waiting' || u.status === 'uploading').length;
  const done = uploads.filter((u) => u.status === 'done').length;
  const failed = uploads.filter((u) => u.status === 'error').length;
  const summary = active
    ? `Uploading ${plural(active, 'document')}.`
    : uploads.length
      ? [done ? `${plural(done, 'document')} uploaded.` : '', failed ? `${plural(failed, 'document')} could not be uploaded.` : ''].filter(Boolean).join(' ')
      : '';

  return (
    <div className="space-y-4">
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
          'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors duration-150 sm:flex-row sm:justify-between sm:text-left',
          dragging ? 'border-focus-ring bg-accent-soft' : 'border-line-strong bg-canvas-raised',
        )}
      >
        <div className="flex items-center gap-3">
          <FileUp className="size-6 shrink-0 text-fg-subtle" aria-hidden />
          <div>
            <p className="font-medium text-fg">Drop documents here to add them to {folderName}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{DOCUMENT_RULES}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => input.current?.click()}>
          Choose documents
        </Button>
        <input
          ref={input}
          type="file"
          accept={DOCUMENT_ACCEPT}
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
    </div>
  );
}
