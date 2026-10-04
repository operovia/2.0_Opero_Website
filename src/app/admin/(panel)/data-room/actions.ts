'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { createFolder, deleteDocument, deleteFolder, moveDocument, moveFolder, renameDocument, renameFolder } from '@/server/data-room';
import { clientIp } from '@/server/request';

const ADMIN_ROOM = '/admin/data-room';

/** The folder the admin is looking at, from a form's hidden field: a uuid, or nothing for the top of the room. */
function folderFrom(formData: FormData, field = 'folder'): string | null {
  const value = String(formData.get(field) ?? '');
  return z.uuid().safeParse(value).success ? value : null;
}

/** Back to the folder the admin was looking at, with no row left in its rename state. */
function backTo(folderId: string | null): never {
  revalidatePath(ADMIN_ROOM);
  redirect(folderId ? `${ADMIN_ROOM}?folder=${folderId}` : ADMIN_ROOM);
}

export async function createFolderAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const parentId = folderFrom(formData);
  const result = await createFolder(parentId, String(formData.get('name') ?? ''), user.id);
  if ('error' in result) {
    revalidatePath(ADMIN_ROOM);
    redirect(`${ADMIN_ROOM}?${new URLSearchParams({ ...(parentId ? { folder: parentId } : {}), error: result.error })}`);
  }
  await audit({ id: user.id, email: user.email }, 'room.folder.add', { target: result.name, ip: await clientIp() });
  backTo(parentId);
}

export async function renameFolderAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const result = await renameFolder(formData.get('id'), String(formData.get('name') ?? ''));
  if (!('error' in result) && result.from !== result.to) {
    await audit({ id: user.id, email: user.email }, 'room.folder.rename', { target: result.to, details: { from: result.from }, ip: await clientIp() });
  }
  backTo(folderFrom(formData));
}

export async function moveFolderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await moveFolder(formData.get('id'), formData.get('direction') === 'up' ? 'up' : 'down');
  backTo(folderFrom(formData));
}

export async function deleteFolderAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await deleteFolder(formData.get('id'));
  if (removed) {
    await audit({ id: user.id, email: user.email }, 'room.folder.remove', {
      target: removed.name,
      details: { folders: removed.folders, documents: removed.documents },
      ip: await clientIp(),
    });
  }
  // The folder may have been the one on screen: its parent is where to land.
  backTo(folderFrom(formData, 'parent'));
}

export async function renameDocumentAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const result = await renameDocument(formData.get('id'), String(formData.get('name') ?? ''));
  if (!('error' in result) && result.from !== result.to) {
    await audit({ id: user.id, email: user.email }, 'room.document.rename', { target: result.to, details: { from: result.from }, ip: await clientIp() });
  }
  backTo(folderFrom(formData));
}

export async function moveDocumentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await moveDocument(formData.get('id'), formData.get('direction') === 'up' ? 'up' : 'down');
  backTo(folderFrom(formData));
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await deleteDocument(formData.get('id'));
  if (removed) await audit({ id: user.id, email: user.email }, 'room.document.remove', { target: removed.title, ip: await clientIp() });
  backTo(folderFrom(formData));
}
