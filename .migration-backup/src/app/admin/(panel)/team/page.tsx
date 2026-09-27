import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import { Time } from '@/components/ui/time';
import { db } from '@/db/client';
import { adminInvites, adminUsers } from '@/db/schema';
import { requireAdmin } from '@/server/auth/session';
import { removeAdmin, resendInvite, revokeInvite } from './actions';
import { InviteForm } from './invite-form';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  const { user: me } = await requireAdmin();

  const admins = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, lastLoginAt: adminUsers.lastLoginAt })
    .from(adminUsers)
    .where(isNull(adminUsers.disabledAt))
    .orderBy(asc(adminUsers.createdAt));

  const invites = await db
    .select({
      id: adminInvites.id,
      email: adminInvites.email,
      name: adminInvites.name,
      expiresAt: adminInvites.expiresAt,
      invitedBy: adminUsers.email,
    })
    .from(adminInvites)
    .leftJoin(adminUsers, eq(adminInvites.invitedBy, adminUsers.id))
    .where(and(isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt), gt(adminInvites.expiresAt, new Date())))
    .orderBy(desc(adminInvites.createdAt));

  return (
    <div className="space-y-8">
      <PageHeader title="Team" description="People who can sign in to this admin." />

      <Card>
        <CardHeader title="Admins" />
        <ul className="divide-y divide-line">
          {admins.map((admin) => (
            <li key={admin.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-fg">
                  <span className="truncate">{admin.name || admin.email}</span>
                  {admin.id === me.id ? <Badge>You</Badge> : null}
                </p>
                <p className="text-sm text-fg-muted">
                  {admin.name ? `${admin.email} · ` : ''}
                  {admin.lastLoginAt ? (
                    <>
                      Last signed in <Time value={admin.lastLoginAt} format="relative" />
                    </>
                  ) : (
                    'Has not signed in yet'
                  )}
                </p>
              </div>
              {admin.id !== me.id && admins.length > 1 ? (
                <form action={removeAdmin}>
                  <input type="hidden" name="id" value={admin.id} />
                  <ConfirmSubmit variant="ghost" size="sm" confirm={`Remove ${admin.email}? They will be signed out and lose access.`}>
                    Remove
                  </ConfirmSubmit>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      {invites.length ? (
        <Card>
          <CardHeader title="Pending invitations" />
          <ul className="divide-y divide-line">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{invite.name || invite.email}</p>
                  <p className="text-sm text-fg-muted">
                    {invite.name ? `${invite.email} · ` : ''}Expires <Time value={invite.expiresAt} format="relative" />
                    {invite.invitedBy ? ` · Invited by ${invite.invitedBy}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={resendInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <SubmitButton variant="secondary" size="sm" pendingLabel="Sending">
                      Resend
                    </SubmitButton>
                  </form>
                  <form action={revokeInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <ConfirmSubmit variant="ghost" size="sm" confirm={`Revoke the invitation for ${invite.email}? The link will stop working.`}>
                      Revoke
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <InviteForm />
    </div>
  );
}
