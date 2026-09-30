'use server';

import { revalidatePath } from 'next/cache';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { bootstrap } from '@/server/bootstrap';
import { lastBootstrap } from '@/server/health';
import { clientIp } from '@/server/request';

/** Prepares the database again, as the server does when it starts. Safe to repeat: it applies only what is missing. */
export async function updateDatabaseAction(): Promise<void> {
  const { user } = await requireAdmin();
  await bootstrap();
  const report = lastBootstrap();
  await audit({ id: user.id, email: user.email }, 'database.update', {
    details: { ok: report?.ok ?? false, ...(report?.message ? { message: report.message } : {}) },
    ip: await clientIp(),
  });
  revalidatePath('/admin', 'layout');
}
