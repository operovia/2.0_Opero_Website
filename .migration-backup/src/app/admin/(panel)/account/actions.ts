'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { failure, fieldErrors, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { hashPassword, newPasswordSchema, verifyPassword } from '@/server/auth/password';
import { destroyOtherSessions, requireAdmin } from '@/server/auth/session';
import { hit, retryWording } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Choose a password you are not using now.' });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, sessionId } = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error) });

  const limit = await hit(`password:${user.id}`, 8, 15 * 60);
  if (!limit.ok) return failure(`Too many attempts. Try again in ${retryWording(limit.retryAfterSeconds)}.`);

  const [row] = await db.select({ passwordHash: adminUsers.passwordHash }).from(adminUsers).where(eq(adminUsers.id, user.id));
  if (!row || !(await verifyPassword(row.passwordHash, parsed.data.currentPassword))) {
    return failure('Check the highlighted fields.', { fieldErrors: { currentPassword: 'That is not your current password.' } });
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword), passwordChangedAt: new Date() })
    .where(eq(adminUsers.id, user.id));
  await destroyOtherSessions(user.id, sessionId);
  await audit({ id: user.id, email: user.email }, 'password.change', { ip: await clientIp() });
  return success('Password changed. Any other devices signed in to your account were signed out.');
}
