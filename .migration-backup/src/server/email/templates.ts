import { renderEmail, type RenderedEmail } from './layout';

type Email = RenderedEmail & { subject: string };

/**
 * Every outbound email's wording lives here. Copy rule: no em dashes.
 */

export function adminInviteEmail({ inviterName, url, expiresInDays }: { inviterName: string; url: string; expiresInDays: number }): Email {
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

const formatNumber = (n: number | null) => (n === null ? '' : n.toLocaleString('en-US'));

export type InquiryForEmail = {
  name: string;
  firm: string;
  email: string;
  phone: string;
  role?: string;
  message?: string;
  commercialSqft?: number | null;
  residentialUnits?: number | null;
  systems?: string;
  interest?: string;
};

export function demoRequestNotification(inquiry: InquiryForEmail, adminUrl: string): Email {
  const subject = `Demo request from ${inquiry.name}, ${inquiry.firm}`;
  return {
    subject,
    ...renderEmail({
      preheader: `${inquiry.name} at ${inquiry.firm} asked for a demo.`,
      heading: 'New demo request',
      body: [`${inquiry.name} at ${inquiry.firm} asked for a demo. Reply to this email to write back to them directly.`],
      details: [
        ['Name', inquiry.name],
        ['Firm', inquiry.firm],
        ['Email', inquiry.email],
        ['Phone', inquiry.phone],
        ['Message', inquiry.message ?? ''],
      ],
      button: { label: 'Open in the admin', url: adminUrl },
    }),
  };
}

export function partnerApplicationNotification(inquiry: InquiryForEmail, adminUrl: string, programLabel: string): Email {
  const label = programLabel.charAt(0).toUpperCase() + programLabel.slice(1);
  const subject = `${label} application from ${inquiry.firm}`;
  return {
    subject,
    ...renderEmail({
      preheader: `${inquiry.name} at ${inquiry.firm} applied for a founding seat.`,
      heading: `New ${programLabel} application`,
      body: [`${inquiry.name} at ${inquiry.firm} applied for a founding seat. Reply to this email to write back to them directly.`],
      details: [
        ['Name', inquiry.name],
        ['Firm', inquiry.firm],
        ['Role', inquiry.role ?? ''],
        ['Email', inquiry.email],
        ['Phone', inquiry.phone],
        ['Commercial square feet', formatNumber(inquiry.commercialSqft ?? null)],
        ['Residential units', formatNumber(inquiry.residentialUnits ?? null)],
        ['Systems today', inquiry.systems ?? ''],
        ['Why interested', inquiry.interest ?? ''],
      ],
      button: { label: 'Open in the admin', url: adminUrl },
    }),
  };
}
