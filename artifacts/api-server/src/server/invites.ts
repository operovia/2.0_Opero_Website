import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@workspace/db';
import { adminInvites } from '@workspace/db';
import { randomToken, sha256 } from '@/server/crypto';
import { adminInviteEmail } from '@/server/email/templates';
import { sendEmail, type SendResult } from '@/server/email/send';
import { siteUrl } from '@/server/env';

export const INVITE_TTL_DAYS = 7;

export type InviteRecord = typeof adminInvites.$inferSelect;

/** Issues a fresh one-time link for an invite and emails it. Only the token's hash is stored. */
export async function issueInviteLink(inviteId: string, email: string, inviterName: string): Promise<SendResult> {
  const token = randomToken();
  await db
    .update(adminInvites)
    .set({ tokenHash: sha256(token), expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000) })
    .where(eq(adminInvites.id, inviteId));
  const url = `${siteUrl()}/admin/accept-invite?token=${encodeURIComponent(token)}`;
  const message = adminInviteEmail({ inviterName, url, expiresInDays: INVITE_TTL_DAYS });
  return sendEmail({ to: email, ...message });
}

/** The pending invite a token belongs to, if it is still usable. */
export async function findUsableInvite(token: string): Promise<InviteRecord | null> {
  if (!token) return null;
  const [invite] = await db
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
    .limit(1);
  return invite ?? null;
}
