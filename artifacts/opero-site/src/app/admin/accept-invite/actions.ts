'use server';

import { and, eq, gt, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db/client';
import { adminInvites, adminUsers } from '@/db/schema';
import { failure, fieldErrors, formValues, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { hashPassword, newPasswordSchema } from '@/server/auth/password';
import { createSession } from '@/server/auth/session';
import { sha256 } from '@/server/crypto';
import { hit, retryWording } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const schema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(1, 'Enter your name.').max(80),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' });

const INVALID = 'This invitation link is no longer valid. Ask an admin to send a new one.';

export async function acceptInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['name']);
  const ip = await clientIp();
  const limit = await hit(`accept-invite:${ip}`, 20, 15 * 60);
  if (!limit.ok) return failure(`Too many attempts. Try again in ${retryWording(limit.retryAfterSeconds)}.`, { values });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values });
  const { token, name, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  const result = await db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(adminInvites)
      .where(
        and(
          eq(adminInvites.tokenHash, sha256(token)),
          isNull(adminInvites.acceptedAt),
          isNull(adminInvites.revokedAt),
          gt(adminInvites.expiresAt, new Date()),
        ),
      )
      .for('update')
      .limit(1);
    if (!invite) return { ok: false as const, error: INVALID };

    const [existing] = await tx.select().from(adminUsers).where(eq(adminUsers.email, invite.email)).limit(1);
    if (existing && !existing.disabledAt) return { ok: false as const, error: 'You already have an account. Sign in instead.' };

    const [user] = existing
      ? await tx
          .update(adminUsers)
          .set({ name, passwordHash, disabledAt: null, passwordChangedAt: new Date() })
          .where(eq(adminUsers.id, existing.id))
          .returning({ id: adminUsers.id, email: adminUsers.email })
      : await tx
          .insert(adminUsers)
          .values({ email: invite.email, name, passwordHash, passwordChangedAt: new Date() })
          .returning({ id: adminUsers.id, email: adminUsers.email });

    await tx.update(adminInvites).set({ acceptedAt: new Date() }).where(eq(adminInvites.id, invite.id));
    return { ok: true as const, user: user! };
  });

  if (!result.ok) return failure(result.error, { values });
  await createSession(result.user.id);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, result.user.id));
  await audit(result.user, 'admin.invite.accept', { ip });
  redirect('/admin');
}
