import { db } from '@/db/client';
import { auditLog } from '@/db/schema';

export type AuditAction =
  | 'login'
  | 'login.failed'
  | 'logout'
  | 'password.change'
  | 'admin.invite'
  | 'admin.invite.revoke'
  | 'admin.invite.accept'
  | 'admin.remove'
  | 'settings.update'
  | 'content.publish'
  | 'content.rollback'
  | 'scenes.update'
  | 'media.upload'
  | 'media.delete'
  | 'survey.create'
  | 'survey.status'
  | 'survey.delete'
  | 'survey.send'
  | 'survey.export'
  | 'survey.responses.delete'
  | 'guest.add'
  | 'guest.remove'
  /** Written with no actor; the target is the address that came in. */
  | 'door.enter';

type Actor = { id: string; email: string } | null;

/** Records an entry in the audit log. Never throws: logging must not break the action. */
export async function audit(
  actor: Actor,
  action: AuditAction,
  { target = '', details = {}, ip = '' }: { target?: string; details?: Record<string, unknown>; ip?: string } = {},
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? '',
      action,
      target,
      details,
      ip,
    });
  } catch (error) {
    console.error('[opero] Could not write audit entry', action, error);
  }
}
