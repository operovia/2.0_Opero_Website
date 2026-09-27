'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { removeMedia } from '@/server/media';
import { clientIp } from '@/server/request';

export type MediaActionResult = { ok: boolean; message: string };

export async function deleteMediaAction(id: string): Promise<MediaActionResult> {
  const { user } = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: 'That image could not be found.' };
  const removed = await removeMedia(id);
  if (!removed) return { ok: false, message: 'That image was already deleted.' };
  await audit({ id: user.id, email: user.email }, 'media.delete', { target: removed.filename, ip: await clientIp() });
  revalidatePath('/admin', 'layout');
  return { ok: true, message: `Deleted ${removed.filename}.` };
}
