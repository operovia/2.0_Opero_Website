import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, isNull, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { dataRoomDocuments, dataRoomEvents, dataRoomFolders, type DataRoomEventAction } from '@/db/schema';
import { buildRoom, findFolder, idsUnder, type DocumentRow, type FolderRow, type Room } from '@/lib/data-room';
import { documentExtension, DOCUMENT_KINDS, MAX_DOCUMENT_BYTES, titleFromFilename } from '@/lib/documents';
import { getStorage } from '@/server/storage';

/**
 * The Data Room: folders and documents the owner shares with invited
 * investors. The admin arranges it here; the room (src/app/(site)/data-room)
 * shows it to guests invited as investors and to admins, and every open and
 * download by a guest is recorded. Files live in storage under docs/, served
 * only through the room's own route, never at a public address.
 */

const isUuid = (value: unknown): value is string => typeof value === 'string' && z.uuid().safeParse(value).success;

/** A folder's or document's name as the room keeps it: one line, single spaces, not too long. */
export function cleanName(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, 160);
}

export const NAME_MAX = 160;

/* ---------------------------------------------------------------- reading */

export async function getRoom(): Promise<Room> {
  const [folders, documents] = await Promise.all([
    db
      .select({
        id: dataRoomFolders.id,
        parentId: dataRoomFolders.parentId,
        name: dataRoomFolders.name,
        position: dataRoomFolders.position,
        createdAt: dataRoomFolders.createdAt,
      })
      .from(dataRoomFolders),
    db
      .select({
        id: dataRoomDocuments.id,
        folderId: dataRoomDocuments.folderId,
        title: dataRoomDocuments.title,
        filename: dataRoomDocuments.filename,
        contentType: dataRoomDocuments.contentType,
        size: dataRoomDocuments.size,
        position: dataRoomDocuments.position,
        createdAt: dataRoomDocuments.createdAt,
      })
      .from(dataRoomDocuments),
  ]);
  return buildRoom(folders satisfies FolderRow[], documents satisfies DocumentRow[]);
}

export type DocumentStats = { opens: number; downloads: number; lastAt: Date | null; lastBy: string };

/** How often each document was opened and downloaded by guests, and who did so last. */
export async function documentStats(): Promise<Map<string, DocumentStats>> {
  const rows = await db
    .select({ documentId: dataRoomEvents.documentId, action: dataRoomEvents.action, count: sql<number>`count(*)::int`, lastAt: max(dataRoomEvents.createdAt) })
    .from(dataRoomEvents)
    .groupBy(dataRoomEvents.documentId, dataRoomEvents.action);
  const stats = new Map<string, DocumentStats>();
  for (const row of rows) {
    const entry = stats.get(row.documentId) ?? { opens: 0, downloads: 0, lastAt: null, lastBy: '' };
    if (row.action === 'open') entry.opens = row.count;
    else entry.downloads = row.count;
    if (row.lastAt && (!entry.lastAt || row.lastAt > entry.lastAt)) entry.lastAt = row.lastAt;
    stats.set(row.documentId, entry);
  }
  if (stats.size) {
    // The latest visitor of each document, in one query.
    const latest = await db
      .selectDistinctOn([dataRoomEvents.documentId], { documentId: dataRoomEvents.documentId, email: dataRoomEvents.email })
      .from(dataRoomEvents)
      .orderBy(dataRoomEvents.documentId, desc(dataRoomEvents.createdAt));
    for (const row of latest) {
      const entry = stats.get(row.documentId);
      if (entry) entry.lastBy = row.email;
    }
  }
  return stats;
}

export type RoomEvent = {
  id: string;
  action: DataRoomEventAction;
  email: string;
  inviteId: string | null;
  createdAt: Date;
  document: { id: string; title: string; folderId: string | null } | null;
};

/** The latest opens and downloads by guests, newest first. */
export async function recentRoomEvents(limit = 100): Promise<RoomEvent[]> {
  const rows = await db
    .select({
      id: dataRoomEvents.id,
      action: dataRoomEvents.action,
      email: dataRoomEvents.email,
      inviteId: dataRoomEvents.inviteId,
      createdAt: dataRoomEvents.createdAt,
      documentId: dataRoomDocuments.id,
      title: dataRoomDocuments.title,
      folderId: dataRoomDocuments.folderId,
    })
    .from(dataRoomEvents)
    .leftJoin(dataRoomDocuments, eq(dataRoomDocuments.id, dataRoomEvents.documentId))
    .orderBy(desc(dataRoomEvents.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    email: row.email,
    inviteId: row.inviteId,
    createdAt: row.createdAt,
    document: row.documentId ? { id: row.documentId, title: row.title ?? '', folderId: row.folderId } : null,
  }));
}

export type StoredDocument = { id: string; title: string; filename: string; storageKey: string; contentType: string; size: number };

/** A document's record, for serving it. The caller decides who may have it. */
export async function getDocument(id: unknown): Promise<StoredDocument | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({
      id: dataRoomDocuments.id,
      title: dataRoomDocuments.title,
      filename: dataRoomDocuments.filename,
      storageKey: dataRoomDocuments.storageKey,
      contentType: dataRoomDocuments.contentType,
      size: dataRoomDocuments.size,
    })
    .from(dataRoomDocuments)
    .where(eq(dataRoomDocuments.id, id))
    .limit(1);
  return row ?? null;
}

/** The file itself, from storage. */
export async function readDocument(document: StoredDocument): Promise<Buffer | null> {
  return getStorage().get(document.storageKey);
}

/** Notes that a guest opened or downloaded a document. Never throws: the file must still be served. */
export async function recordDocumentEvent(
  documentId: string,
  action: DataRoomEventAction,
  guest: { inviteId: string; email: string },
  ip: string,
): Promise<void> {
  try {
    await db.insert(dataRoomEvents).values({ documentId, action, inviteId: guest.inviteId, email: guest.email, ip });
  } catch (error) {
    console.error('[opero] Could not record a Data Room visit', error);
  }
}

/* ---------------------------------------------------------------- folders */

/** Whether the id names a folder, or is null for the top of the room. */
async function folderExists(id: string | null): Promise<boolean> {
  if (id === null) return true;
  if (!isUuid(id)) return false;
  const [row] = await db.select({ id: dataRoomFolders.id }).from(dataRoomFolders).where(eq(dataRoomFolders.id, id)).limit(1);
  return row !== undefined;
}

const sameParent = (parentId: string | null) => (parentId === null ? isNull(dataRoomFolders.parentId) : eq(dataRoomFolders.parentId, parentId));
const sameFolder = (folderId: string | null) => (folderId === null ? isNull(dataRoomDocuments.folderId) : eq(dataRoomDocuments.folderId, folderId));

export async function createFolder(parentId: string | null, name: string, adminId: string | null): Promise<{ id: string; name: string } | { error: string }> {
  const clean = cleanName(name);
  if (!clean) return { error: 'Give the folder a name.' };
  if (!(await folderExists(parentId))) return { error: 'That folder is gone. Reload the page.' };
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dataRoomFolders)
    .where(sameParent(parentId));
  const [row] = await db
    .insert(dataRoomFolders)
    .values({ parentId, name: clean, position: count ?? 0, createdBy: adminId })
    .returning({ id: dataRoomFolders.id, name: dataRoomFolders.name });
  return row!;
}

export async function renameFolder(id: unknown, name: string): Promise<{ from: string; to: string } | { error: string }> {
  const clean = cleanName(name);
  if (!clean) return { error: 'Give the folder a name.' };
  if (!isUuid(id)) return { error: 'That folder could not be found.' };
  const [before] = await db.select({ name: dataRoomFolders.name }).from(dataRoomFolders).where(eq(dataRoomFolders.id, id)).limit(1);
  if (!before) return { error: 'That folder is gone. Reload the page.' };
  if (before.name !== clean) await db.update(dataRoomFolders).set({ name: clean }).where(eq(dataRoomFolders.id, id));
  return { from: before.name, to: clean };
}

/** Moves a folder one place up or down among its siblings. */
export async function moveFolder(id: unknown, direction: 'up' | 'down'): Promise<boolean> {
  if (!isUuid(id)) return false;
  const [folder] = await db.select({ parentId: dataRoomFolders.parentId }).from(dataRoomFolders).where(eq(dataRoomFolders.id, id)).limit(1);
  if (!folder) return false;
  const siblings = await db
    .select({ id: dataRoomFolders.id })
    .from(dataRoomFolders)
    .where(sameParent(folder.parentId))
    .orderBy(dataRoomFolders.position, dataRoomFolders.createdAt, dataRoomFolders.id);
  const order = reorder(
    siblings.map((s) => s.id),
    id,
    direction,
  );
  if (!order) return false;
  await db.transaction(async (tx) => {
    for (const [position, folderId] of order.entries()) await tx.update(dataRoomFolders).set({ position }).where(eq(dataRoomFolders.id, folderId));
  });
  return true;
}

/** Deletes a folder with everything in it. Files go after the rows, and a file that will not go is logged, never fatal. */
export async function deleteFolder(id: unknown): Promise<{ name: string; folders: number; documents: number } | null> {
  if (!isUuid(id)) return null;
  const room = await getRoom();
  const folder = findFolder(room, id);
  if (!folder) return null;
  const { folderIds, documentIds } = idsUnder(folder);
  const keys = documentIds.length
    ? await db.select({ key: dataRoomDocuments.storageKey }).from(dataRoomDocuments).where(inArray(dataRoomDocuments.id, documentIds))
    : [];
  await db.delete(dataRoomFolders).where(eq(dataRoomFolders.id, id));
  await removeFiles(keys.map((row) => row.key));
  return { name: folder.name, folders: folderIds.length - 1, documents: documentIds.length };
}

/* -------------------------------------------------------------- documents */

export type UploadResult = { ok: true; id: string; title: string; filename: string } | { ok: false; error: string };

/**
 * Stores an uploaded document in the given folder (null for the top of the
 * room). The kind comes from the file's name, never from what the upload
 * says it is, and the room serves it under that kind.
 */
export async function storeDocument(file: File, folderId: string | null, adminId: string | null): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: 'That file is empty.' };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: 'Documents can be up to 25 MB.' };
  const ext = documentExtension(file.name);
  if (!ext) return { ok: false, error: 'That kind of file is not accepted. Upload a PDF, Word, Excel, PowerPoint, CSV, text, image, or ZIP file.' };
  if (!(await folderExists(folderId))) return { ok: false, error: 'That folder is gone. Reload the page.' };

  const body = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const key = `docs/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
  const kind = DOCUMENT_KINDS[ext]!;
  await getStorage().put(key, body, kind.type, 'private');

  const filename = (file.name || `document.${ext}`).replace(/[^\w.\- ()]+/g, '_').slice(0, 180);
  const title = titleFromFilename(file.name || filename);
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dataRoomDocuments)
      .where(sameFolder(folderId));
    const [row] = await db
      .insert(dataRoomDocuments)
      .values({ folderId, title, filename, storageKey: key, contentType: kind.type, size: body.length, position: count ?? 0, uploadedBy: adminId })
      .returning({ id: dataRoomDocuments.id });
    return { ok: true, id: row!.id, title, filename };
  } catch (error) {
    await getStorage()
      .remove(key)
      .catch(() => {});
    throw error;
  }
}

export async function renameDocument(id: unknown, title: string): Promise<{ from: string; to: string } | { error: string }> {
  const clean = cleanName(title);
  if (!clean) return { error: 'Give the document a name.' };
  if (!isUuid(id)) return { error: 'That document could not be found.' };
  const [before] = await db.select({ title: dataRoomDocuments.title }).from(dataRoomDocuments).where(eq(dataRoomDocuments.id, id)).limit(1);
  if (!before) return { error: 'That document is gone. Reload the page.' };
  if (before.title !== clean) await db.update(dataRoomDocuments).set({ title: clean }).where(eq(dataRoomDocuments.id, id));
  return { from: before.title, to: clean };
}

/** Moves a document one place up or down among the documents of its folder. */
export async function moveDocument(id: unknown, direction: 'up' | 'down'): Promise<boolean> {
  if (!isUuid(id)) return false;
  const [document] = await db.select({ folderId: dataRoomDocuments.folderId }).from(dataRoomDocuments).where(eq(dataRoomDocuments.id, id)).limit(1);
  if (!document) return false;
  const siblings = await db
    .select({ id: dataRoomDocuments.id })
    .from(dataRoomDocuments)
    .where(sameFolder(document.folderId))
    .orderBy(dataRoomDocuments.position, dataRoomDocuments.createdAt, dataRoomDocuments.id);
  const order = reorder(
    siblings.map((s) => s.id),
    id,
    direction,
  );
  if (!order) return false;
  await db.transaction(async (tx) => {
    for (const [position, documentId] of order.entries()) await tx.update(dataRoomDocuments).set({ position }).where(eq(dataRoomDocuments.id, documentId));
  });
  return true;
}

export async function deleteDocument(id: unknown): Promise<{ title: string } | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .delete(dataRoomDocuments)
    .where(eq(dataRoomDocuments.id, id))
    .returning({ title: dataRoomDocuments.title, key: dataRoomDocuments.storageKey });
  if (!row) return null;
  await removeFiles([row.key]);
  return { title: row.title };
}

/* ---------------------------------------------------------------- helpers */

/** The ids with `id` swapped one place in the given direction, or null when it is already at that end. */
function reorder(ids: string[], id: string, direction: 'up' | 'down'): string[] | null {
  const from = ids.indexOf(id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

async function removeFiles(keys: string[]): Promise<void> {
  const storage = getStorage();
  for (const key of keys) {
    try {
      await storage.remove(key);
    } catch (error) {
      console.error('[opero] Could not remove a Data Room file from storage', key, error);
    }
  }
}

/** How many documents a guest opened or downloaded, for the Guests page. */
export async function guestDocumentCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ inviteId: dataRoomEvents.inviteId, count: sql<number>`count(distinct ${dataRoomEvents.documentId})::int` })
    .from(dataRoomEvents)
    .where(and(sql`${dataRoomEvents.inviteId} is not null`))
    .groupBy(dataRoomEvents.inviteId);
  return new Map(rows.filter((row) => row.inviteId).map((row) => [row.inviteId!, row.count]));
}
