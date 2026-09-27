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
  'media.upload': 'Uploaded an image',
  'media.delete': 'Deleted an image',
  'survey.create': 'Created a survey',
  'survey.status': "Changed a survey's status",
  'survey.delete': 'Deleted a survey',
  'survey.send': 'Sent survey emails',
  'survey.export': 'Exported survey responses',
  'survey.responses.delete': 'Deleted survey responses',
};

export const auditFilters = {
  all: { label: 'All activity', actions: null },
  signins: { label: 'Sign-ins', actions: ['login', 'login.failed', 'logout'] },
  content: { label: 'Content', actions: ['content.publish', 'content.rollback', 'scenes.update', 'media.upload', 'media.delete'] },
  admin: {
    label: 'Team and settings',
    actions: ['password.change', 'admin.invite', 'admin.invite.revoke', 'admin.invite.accept', 'admin.remove', 'settings.update'],
  },
  surveys: { label: 'Surveys', actions: ['survey.create', 'survey.status', 'survey.delete', 'survey.send', 'survey.export', 'survey.responses.delete'] },
} as const satisfies Record<string, { label: string; actions: readonly AuditAction[] | null }>;

export type AuditFilter = keyof typeof auditFilters;
