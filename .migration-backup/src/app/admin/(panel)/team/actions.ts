'use server';

import { and, count, eq, isNull, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db/client';
import { adminInvites, adminUsers } from '@/db/schema';
import { failure, fieldErrors, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { destroyAllSessions, requireAdmin } from '@/server/auth/session';
import { randomToken, sha256 } from '@/server/crypto';
import { INVITE_TTL_DAYS, issueInviteLink } from '@/server/invites';
import { hit } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const inviteSchema = z.object({
  name: z.string().trim().max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export async function inviteAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const values = formValues(formData, ['name', 'email']);
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values });
  const { name, email } = parsed.data;

  const limit = await hit(`invite:${user.id}`, 20, 60 * 60);
  if (!limit.ok) return failure('You have sent a lot of invitations recently. Try again in an hour.', { values });

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email), isNull(adminUsers.disabledAt)))
    .limit(1);
  if (existing) return failure('That person is already an admin.', { fieldErrors: { email: 'Already an admin.' }, values });

  // One pending invitation per email: replace any earlier one.
  await db
    .update(adminInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminInvites.email, email), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt)));
  const [invite] = await db
    .insert(adminInvites)
    .values({
      email,
      name,
      invitedBy: user.id,
      tokenHash: sha256(randomToken()),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    })
    .returning({ id: adminInvites.id });

  const sent = await issueInviteLink(invite!.id, email, user.name || user.email);
  await audit({ id: user.id, email: user.email }, 'admin.invite', { target: email, ip: await clientIp() });
  revalidatePath('/admin/team');
  if (!sent.ok) return failure(`The invitation was created, but the email could not be sent (${sent.error}). Try resending it.`);
  return success(`Invitation sent to ${email}.`, { values: { name: '', email: '' } });
}

async function pendingInvite(id: string) {
  const [invite] = await db
    .select()
    .from(adminInvites)
    .where(and(eq(adminInvites.id, id), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt)))
    .limit(1);
  return invite;
}

export async function resendInvite(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const invite = await pendingInvite(String(formData.get('id') ?? ''));
  if (!invite) return;
  const limit = await hit(`invite:${user.id}`, 20, 60 * 60);
  if (!limit.ok) return;
  await issueInviteLink(invite.id, invite.email, user.name || user.email);
  await audit({ id: user.id, email: user.email }, 'admin.invite', { target: invite.email, details: { resent: true }, ip: await clientIp() });
  revalidatePath('/admin/team');
}

export async function revokeInvite(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const invite = await pendingInvite(String(formData.get('id') ?? ''));
  if (!invite) return;
  await db.update(adminInvites).set({ revokedAt: new Date() }).where(eq(adminInvites.id, invite.id));
  await audit({ id: user.id, email: user.email }, 'admin.invite.revoke', { target: invite.email, ip: await clientIp() });
  revalidatePath('/admin/team');
}

export async function removeAdmin(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id || id === user.id) return;

  const [others] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(and(isNull(adminUsers.disabledAt), ne(adminUsers.id, id)));
  if (!others || others.n < 1) return;

  const [target] = await db
    .update(adminUsers)
    .set({ disabledAt: new Date() })
    .where(and(eq(adminUsers.id, id), isNull(adminUsers.disabledAt)))
    .returning({ email: adminUsers.email });
  if (!target) return;
  await destroyAllSessions(id);
  await audit({ id: user.id, email: user.email }, 'admin.remove', { target: target.email, ip: await clientIp() });
  revalidatePath('/admin/team');
}
