'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db/client';
import { adminUsers } from '@/db/schema';
import { failure, fieldErrors, formValues, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { safeAdminRedirect } from '@/server/auth/constants';
import { dummyPasswordHash, verifyPassword } from '@/server/auth/password';
import { createSession } from '@/server/auth/session';
import { clear, hit, retryWording } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter the email address for your account.'),
  password: z.string().min(1, 'Enter your password.'),
  next: z.string().optional(),
});

const WINDOW_SECONDS = 15 * 60;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  const values = formValues(formData, ['email']);
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values });
  const { email, password, next } = parsed.data;

  const ip = await clientIp();
  const byIp = await hit(`login:ip:${ip}`, 30, WINDOW_SECONDS);
  const byEmail = await hit(`login:email:${email}`, 6, WINDOW_SECONDS);
  if (!byIp.ok || !byEmail.ok) {
    const wait = Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds);
    return failure(`Too many sign-in attempts. Try again in ${retryWording(wait)}.`, { values });
  }

  const [user] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email), isNull(adminUsers.disabledAt)))
    .limit(1);

  // Check a password either way, so response time does not reveal whether the email exists.
  const valid = await verifyPassword(user?.passwordHash ?? (await dummyPasswordHash()), password);
  if (!user || !valid) {
    await audit(user ? { id: user.id, email: user.email } : null, 'login.failed', { details: { email }, ip });
    return failure('That email and password do not match an account.', { values });
  }

  await createSession(user.id);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await clear(`login:email:${email}`);
  await audit({ id: user.id, email: user.email }, 'login', { ip });
  redirect(safeAdminRedirect(next));
}
