import type { AuditAction } from './audit';

export const auditLabels: Record<AuditAction, string> = {
  login: 'Signed in',
  'login.failed': 'Failed sign-in attempt',
  logout: 'Signed out',
  'password.change': 'Changed their password',
  'admin.invite': 'Invited an admin',
  'admin.invite.revoke': 'Revoked an invitation',
  'admin.invite.accept': 'Accepted an invitation',
  'admin.remove': 'Removed an admin',
  'settings.update': 'Updated settings',
  'content.publish': 'Published content',
  'content.rollback': 'Rolled back content',
  'scenes.update': 'Updated the Oppie console',
  'survey.send': 'Sent survey emails',
};

export const auditFilters = {
  all: { label: 'All activity', actions: null },
  signins: { label: 'Sign-ins', actions: ['login', 'login.failed', 'logout'] },
  content: { label: 'Content', actions: ['content.publish', 'content.rollback', 'scenes.update'] },
  admin: {
    label: 'Team and settings',
    actions: ['password.change', 'admin.invite', 'admin.invite.revoke', 'admin.invite.accept', 'admin.remove', 'settings.update'],
  },
  surveys: { label: 'Surveys', actions: ['survey.send'] },
} as const satisfies Record<string, { label: string; actions: readonly AuditAction[] | null }>;

export type AuditFilter = keyof typeof auditFilters;
