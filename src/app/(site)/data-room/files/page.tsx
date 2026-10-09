import { ChevronRight, Download, ExternalLink, FileText, Folder, FolderOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { Time } from '@/components/ui/time';
import { DATA_ROOM_FILES_PATH } from '@/content/constants';
import { getPage } from '@/content/store';
import { cn } from '@/lib/cn';
import { findFolder, flattenFolders, trailTo, type RoomDocument, type RoomFolder } from '@/lib/data-room';
import { documentKind, formatBytes } from '@/lib/documents';
import { renderHeadline } from '@/lib/headline';
import { dataRoomHidden } from '@/server/data-room-access';
import { getRoom } from '@/server/data-room';
import { getAccess, requireEntry } from '@/server/entry';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const [{ room }, access] = await Promise.all([getPage('dataRoom'), getAccess()]);
  // Hidden pages give away nothing, not even their title.
  if (dataRoomHidden(access)) notFound();
  return {
    title: `${room.documentsTab} | ${room.label}`,
    description: room.metaDescription,
    // Only guests and admins can open it; it stays out of search.
    robots: { index: false, follow: false },
  };
}

const folderHref = (id: string | null) => (id ? `${DATA_ROOM_FILES_PATH}?folder=${id}` : DATA_ROOM_FILES_PATH);
const fileHref = (id: string, download = false) => `${DATA_ROOM_FILES_PATH}/${id}${download ? '?download=1' : ''}`;
const action =
  'inline-flex h-9 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-fg-subtle';

/**
 * The Data Room's documents: the folders down the side, the folder on
 * screen with what is in it, numbered as the admin arranged them. Every
 * document opens or downloads through the room's own route, which checks
 * who is asking and records a guest's visit.
 */
export default async function DataRoomFilesPage({ searchParams }: PageProps<'/data-room/files'>) {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  await noteVisit(DATA_ROOM_FILES_PATH);
  const [{ room: copy }, room, params] = await Promise.all([getPage('dataRoom'), getRoom(), searchParams]);
  const folderParam = typeof params.folder === 'string' ? params.folder : null;
  const current = folderParam ? findFolder(room, folderParam) : null;
  if (folderParam && !current) notFound();
  const here = current ?? room;
  const trail = current ? trailTo(room, current.id) : [];
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const folders = flattenFolders(room);

  return (
    <>
      <RoomNav room={copy} />
      <section aria-labelledby="room-title" className="py-section">
        <Container size="5xl">
          <Eyebrow>{copy.label}</Eyebrow>
          <h1 id="room-title" className="mt-5 max-w-3xl text-display-sm font-medium text-metal">
            {renderHeadline(copy.headline)}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fg-muted">{copy.intro}</p>

          <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <nav aria-label={copy.foldersLabel} className="rounded-2xl border border-line bg-surface p-3">
              <ul className="space-y-0.5 text-sm">
                <li>
                  <TreeLink href={folderHref(null)} active={!current} depth={0}>
                    <FolderOpen className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                    <span className="truncate">{copy.rootLabel}</span>
                  </TreeLink>
                </li>
                {folders.map(({ folder, depth }) => (
                  <li key={folder.id}>
                    <TreeLink href={folderHref(folder.id)} active={folder.id === current?.id} depth={depth + 1}>
                      <Folder className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                      <span className="truncate">
                        <span className="text-fg-subtle tabular-nums">{folder.index}</span> {folder.name}
                      </span>
                    </TreeLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0">
              {/* The trail to this folder: a line of links, not a landmark, since the strip above already carries the room's name. */}
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
                <Link href={folderHref(null)} aria-current={!current ? 'page' : undefined} className={cn(!current ? 'font-medium text-fg' : 'hover:text-fg')}>
                  {copy.rootLabel}
                </Link>
                {trail.map((folder) => (
                  <span key={folder.id} className="flex items-center gap-1.5">
                    <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
                    <Link
                      href={folderHref(folder.id)}
                      aria-current={folder.id === current?.id ? 'page' : undefined}
                      className={cn(folder.id === current?.id ? 'font-medium text-fg' : 'hover:text-fg')}
                    >
                      {folder.name}
                    </Link>
                  </span>
                ))}
              </p>
              <p className="mt-2 text-sm text-fg-subtle">
                {count(here.folders.length, copy.folderWord, copy.folderWordPlural)}, {count(here.documents.length, copy.documentWord, copy.documentWordPlural)}
              </p>

              {here.folders.length || here.documents.length ? (
                <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
                  {here.folders.map((folder) => (
                    <FolderItem key={folder.id} folder={folder} count={count} copy={copy} />
                  ))}
                  {here.documents.map((document) => (
                    <DocumentItem key={document.id} document={document} copy={copy} />
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center text-fg-muted">{copy.emptyMessage}</p>
              )}
              {copy.trackingNote ? <p className="mt-6 text-sm text-fg-subtle">{copy.trackingNote}</p> : null}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

type Copy = Awaited<ReturnType<typeof getPage<'dataRoom'>>>['room'];

function TreeLink({ href, active, depth, children }: { href: string; active: boolean; depth: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{ paddingLeft: `${0.75 + depth}rem` }}
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg pr-3 transition-colors duration-150',
        active ? 'bg-accent-soft font-medium text-fg' : 'text-fg-muted hover:bg-accent-soft hover:text-fg',
      )}
    >
      {children}
    </Link>
  );
}

function FolderItem({ folder, count, copy }: { folder: RoomFolder; count: (n: number, one: string, many: string) => string; copy: Copy }) {
  return (
    <li>
      <Link href={folderHref(folder.id)} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-raised">
        <Folder className="size-6 shrink-0 text-fg-subtle" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-fg">
            <span className="text-fg-subtle tabular-nums">{folder.index}</span> {folder.name}
          </span>
          <span className="block text-sm text-fg-muted">
            {count(folder.folders.length, copy.folderWord, copy.folderWordPlural)}, {count(folder.totalDocuments, copy.documentWord, copy.documentWordPlural)}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

function DocumentItem({ document, copy }: { document: RoomDocument; copy: Copy }) {
  const kind = documentKind(document.filename);
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <FileText className="size-6 shrink-0 text-fg-subtle" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">
          <span className="text-fg-subtle tabular-nums">{document.index}</span> {document.title}
        </p>
        <p className="text-sm text-fg-muted">
          {kind.label} · {formatBytes(document.size)} · {copy.addedLabel} <Time value={document.createdAt} format="date" />
        </p>
      </div>
      <div className="flex items-center gap-2">
        {kind.inline ? (
          <a href={fileHref(document.id)} target="_blank" rel="noreferrer" className={action}>
            <ExternalLink className="size-4" aria-hidden />
            {copy.openLabel}
            <span className="sr-only"> {document.title} (opens in a new tab)</span>
          </a>
        ) : null}
        <a href={fileHref(document.id, true)} className={action}>
          <Download className="size-4" aria-hidden />
          {copy.downloadLabel}
          <span className="sr-only"> {document.title}</span>
        </a>
      </div>
    </li>
  );
}
