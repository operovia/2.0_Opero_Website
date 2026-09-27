import { renderEmail, type RenderedEmail } from './layout';

/**
 * Every outbound email's wording lives here. Copy rule: no em dashes.
 */

export function adminInviteEmail({ inviterName, url, expiresInDays }: { inviterName: string; url: string; expiresInDays: number }): RenderedEmail & { subject: string } {
  const subject = 'You have been invited to manage the Opero site';
  return {
    subject,
    ...renderEmail({
      preheader: 'Set a password to finish creating your admin account.',
      heading: 'You are invited',
      body: [
        `${inviterName} added you as an admin for the Opero website. Set a password to finish creating your account.`,
        `This link works once and expires in ${expiresInDays} days.`,
      ],
      button: { label: 'Set your password', url },
      footnote: 'If you were not expecting this invitation, you can ignore this email.',
    }),
  };
}
