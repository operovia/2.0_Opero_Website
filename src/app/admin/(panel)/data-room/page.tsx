import { ArrowDown, ArrowUp, ChevronRight, ExternalLink, FileText, Folder, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import { Time } from '@/components/ui/time';
import { DATA_ROOM_FILES_PATH } from '@/content/constants';
import { cn } from '@/lib/cn';
import { findFolder, flattenFolders, trailTo, type RoomDocument, type RoomFolder } from '@/lib/data-room';
import { documentKind, formatBytes } from '@/lib/documents';
import { requireAdmin } from '@/server/auth/session';
import { documentStats, getRoom, NAME_MAX, recentRoomEvents, type DocumentStats, type RoomEvent } from '@/server/data-room';
import {
  createFolderAction,
  deleteDocumentAction,
  deleteFolderAction,
  moveDocumentAction,
  moveFolderAction,
  renameDocumentAction,
  renameFolderAction,
} from './actions';
import { Uploader } from './uploader';

export const metadata: Metadata = { title: 'Data Room' };

const ROOT_NAME = 'All documents';
const roomHref = (folderId: string | null) => (folderId ? `/admin/data-room?folder=${folderId}` : '/admin/data-room');
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/**
 * The Data Room as the admin arranges it: the folders down the side, the
 * folder on screen with what is in it, and what guests opened and
 * downloaded. Everything is a form, so it works without JavaScript; only the
 * upload control needs it.
 */
export default async function DataRoomAdminPage({ searchParams }: PageProps<'/admin/data-room'>) {
  await requireAdmin();
  const params = await searchParams;
  const [room, stats, events] = await Promise.all([getRoom(), documentStats(), recentRoomEvents(60)]);
  const current = findFolder(room, typeof params.folder === 'string' ? params.folder : null);
  const folderId = current?.id ?? null;
  const renaming = typeof params.rename === 'string' ? params.rename : null;
  const error = typeof params.error === 'string' ? params.error : null;
  const trail = current ? trailTo(room, current.id) : [];
  const here = current ?? room;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Data Room"
        description="Folders and documents for guests invited as investors. The room shows them in this order, numbered as you see them here, and records what each guest opens and downloads."
        actions={
          <a href={DATA_ROOM_FILES_PATH} target="_blank" rel="noreferrer" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <ExternalLink className="size-4" aria-hidden />
            Open the room<span className="sr-only"> (opens in a new tab)</span>
          </a>
        }
      />

      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Folders" description={`${plural(room.totalDocuments, 'document')} in all.`} />
          <CardBody className="px-3 py-3">
            <nav aria-label="Folders">
              <ul className="space-y-0.5 text-sm">
                <li>
                  <TreeLink href={roomHref(null)} active={!current} depth={0}>
                    <FolderOpen className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                    <span className="truncate">{ROOT_NAME}</span>
                  </TreeLink>
                </li>
                {flattenFolders(room).map(({ folder, depth }) => (
                  <li key={folder.id}>
                    <TreeLink href={roomHref(folder.id)} active={folder.id === folderId} depth={depth + 1}>
                      <Folder className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                      <span className="truncate">
                        <span className="text-fg-subtle tabular-nums">{folder.index}</span> {folder.name}
                      </span>
                    </TreeLink>
                  </li>
                ))}
              </ul>
            </nav>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex flex-wrap items-center gap-1.5">
                <Link href={roomHref(null)} className={cn('hover:underline', !current && 'pointer-events-none')}>
                  {ROOT_NAME}
                </Link>
                {trail.map((folder) => (
                  <span key={folder.id} className="flex items-center gap-1.5">
                    <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
                    <Link href={roomHref(folder.id)} className={cn('hover:underline', folder.id === folderId && 'pointer-events-none')}>
                      {folder.name}
                    </Link>
                  </span>
                ))}
              </span>
            }
            description={`${plural(here.folders.length, 'folder')}, ${plural(here.documents.length, 'document')}${current ? ` (${plural(current.totalDocuments, 'document')} in all)` : ''}.`}
          />
          <CardBody className="space-y-6">
            <form action={createFolderAction} className="flex max-w-lg items-end gap-2">
              {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="new-folder" className="block text-sm font-medium text-fg">
                  New folder
                </label>
                <Input
                  id="new-folder"
                  name="name"
                  variant="compact"
                  maxLength={NAME_MAX}
                  placeholder="Financial information, for example"
                  autoComplete="off"
                  required
                />
              </div>
              <SubmitButton variant="secondary" size="sm" pendingLabel="Adding">
                Add folder
              </SubmitButton>
            </form>

            <Uploader folderId={folderId} folderName={current?.name ?? ROOT_NAME} />

            {here.folders.length || here.documents.length ? (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {here.folders.map((folder, i) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    folderId={folderId}
                    first={i === 0}
                    last={i === here.folders.length - 1}
                    renaming={renaming === folder.id}
                  />
                ))}
                {here.documents.map((document, i) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    folderId={folderId}
                    first={i === 0}
                    last={i === here.documents.length - 1}
                    renaming={renaming === document.id}
                    stats={stats.get(document.id)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title={current ? 'This folder is empty' : 'The room is empty'}>
                Add a folder above, or drop documents here. Guests see a folder once something is in it.
              </EmptyState>
            )}
          </CardBody>
        </Card>
      </div>

      <Card id="activity">
        <CardHeader title="Activity" description="What guests opened and downloaded, newest first. Your own visits are not recorded." />
        {events.length ? (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <CardBody>
            <p className="text-sm text-fg-muted">No guest has opened a document yet.</p>
          </CardBody>
        )}
      </Card>
    </div>
  );
}

function TreeLink({ href, active, depth, children }: { href: string; active: boolean; depth: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
      className={cn(
        'flex h-9 items-center gap-2 rounded-md pr-3 transition-colors duration-150',
        active ? 'bg-accent-soft font-medium text-fg' : 'text-fg-muted hover:bg-accent-soft hover:text-fg',
      )}
    >
      {children}
    </Link>
  );
}

function MoveButtons({
  action,
  id,
  folderId,
  first,
  last,
  what,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  folderId: string | null;
  first: boolean;
  last: boolean;
  what: string;
}) {
  return (
    <>
      {(['up', 'down'] as const).map((direction) => (
        <form key={direction} action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value={direction} />
          {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
          <SubmitButton variant="ghost" size="icon" disabled={direction === 'up' ? first : last} title={direction === 'up' ? 'Move up' : 'Move down'}>
            {direction === 'up' ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}
            <span className="sr-only">
              Move {what} {direction}
            </span>
          </SubmitButton>
        </form>
      ))}
    </>
  );
}

function RenameForm({
  action,
  id,
  folderId,
  value,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  folderId: string | null;
  value: string;
  label: string;
}) {
  return (
    <form action={action} className="flex min-w-0 flex-1 items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
      <label htmlFor={`rename-${id}`} className="sr-only">
        {label}
      </label>
      <Input id={`rename-${id}`} name="name" variant="compact" defaultValue={value} maxLength={NAME_MAX} autoComplete="off" autoFocus required />
      <SubmitButton size="sm" pendingLabel="Saving">
        Save
      </SubmitButton>
      <Link href={roomHref(folderId)} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
        Cancel
      </Link>
    </form>
  );
}

function FolderRow({
  folder,
  folderId,
  first,
  last,
  renaming,
}: {
  folder: RoomFolder;
  folderId: string | null;
  first: boolean;
  last: boolean;
  renaming: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Folder className="size-5 shrink-0 text-fg-subtle" aria-hidden />
      {renaming ? (
        <RenameForm action={renameFolderAction} id={folder.id} folderId={folderId} value={folder.name} label={`New name for ${folder.name}`} />
      ) : (
        <div className="min-w-0 flex-1">
          <Link href={roomHref(folder.id)} className="font-medium text-fg hover:underline">
            <span className="text-fg-subtle tabular-nums">{folder.index}</span> {folder.name}
          </Link>
          <p className="text-sm text-fg-muted">
            {plural(folder.folders.length, 'folder')}, {plural(folder.documents.length, 'document')}
            {folder.folders.length ? ` (${plural(folder.totalDocuments, 'document')} in all)` : ''}
          </p>
        </div>
      )}
      <div className="flex items-center gap-1">
        <MoveButtons action={moveFolderAction} id={folder.id} folderId={folderId} first={first} last={last} what={folder.name} />
        <Link
          href={`${roomHref(folderId)}${folderId ? '&' : '?'}rename=${folder.id}`}
          className={buttonClasses({ variant: 'ghost', size: 'icon' })}
          title="Rename"
        >
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Rename {folder.name}</span>
        </Link>
        <form action={deleteFolderAction}>
          <input type="hidden" name="id" value={folder.id} />
          {folderId ? <input type="hidden" name="parent" value={folderId} /> : null}
          <ConfirmSubmit
            variant="ghost-danger"
            size="icon"
            title="Delete"
            confirm={`Delete the folder ${folder.name} with everything in it (${plural(folder.totalDocuments, 'document')})? Guests lose access at once. This cannot be undone.`}
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="sr-only">Delete {folder.name}</span>
          </ConfirmSubmit>
        </form>
      </div>
    </li>
  );
}

function DocumentRow({
  document,
  folderId,
  first,
  last,
  renaming,
  stats,
}: {
  document: RoomDocument;
  folderId: string | null;
  first: boolean;
  last: boolean;
  renaming: boolean;
  stats: DocumentStats | undefined;
}) {
  const kind = documentKind(document.filename);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <FileText className="size-5 shrink-0 text-fg-subtle" aria-hidden />
      {renaming ? (
        <RenameForm action={renameDocumentAction} id={document.id} folderId={folderId} value={document.title} label={`New name for ${document.title}`} />
      ) : (
        <div className="min-w-0 flex-1">
          <a href={`${DATA_ROOM_FILES_PATH}/${document.id}`} target="_blank" rel="noreferrer" className="font-medium text-fg hover:underline">
            <span className="text-fg-subtle tabular-nums">{document.index}</span> {document.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="text-sm text-fg-muted">
            {kind.label} · {formatBytes(document.size)} · {document.filename} · Added <Time value={document.createdAt} format="date" />
          </p>
          <p className="text-xs text-fg-subtle">
            {stats
              ? `Opened ${stats.opens} ${stats.opens === 1 ? 'time' : 'times'}, downloaded ${stats.downloads}${stats.lastBy ? `, last by ${stats.lastBy}` : ''}`
              : 'No guest has opened it yet'}
          </p>
        </div>
      )}
      <div className="flex items-center gap-1">
        <MoveButtons action={moveDocumentAction} id={document.id} folderId={folderId} first={first} last={last} what={document.title} />
        <Link
          href={`${roomHref(folderId)}${folderId ? '&' : '?'}rename=${document.id}`}
          className={buttonClasses({ variant: 'ghost', size: 'icon' })}
          title="Rename"
        >
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Rename {document.title}</span>
        </Link>
        <form action={deleteDocumentAction}>
          <input type="hidden" name="id" value={document.id} />
          {folderId ? <input type="hidden" name="folder" value={folderId} /> : null}
          <ConfirmSubmit
            variant="ghost-danger"
            size="icon"
            title="Delete"
            confirm={`Delete ${document.title}? Guests lose access at once. This cannot be undone.`}
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="sr-only">Delete {document.title}</span>
          </ConfirmSubmit>
        </form>
      </div>
    </li>
  );
}

function EventRow({ event }: { event: RoomEvent }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-3 text-sm">
      <span className="w-40 shrink-0 text-fg-subtle">
        <Time value={event.createdAt} format="relative" />
      </span>
      <span className="font-medium text-fg">{event.email || 'A guest'}</span>
      <span className="text-fg-muted">{event.action === 'open' ? 'opened' : 'downloaded'}</span>
      {event.document ? (
        <Link href={roomHref(event.document.folderId)} className="text-fg hover:underline">
          {event.document.title}
        </Link>
      ) : (
        <span className="text-fg-subtle">a document since deleted</span>
      )}
    </li>
  );
}
