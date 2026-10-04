import { renderEmail, type RenderedEmail } from './layout';
import { GUEST_ROLE_LABELS, type GuestRole } from '@/content/constants';

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

/** Sent the first time a guest gives their address at the front door. */
export function guestEnteredNotification({ email, role, ip }: { email: string; role: GuestRole; ip: string }, adminUrl: string): Email {
  const subject = `${email} entered the site as a guest`;
  const { label, sees } = GUEST_ROLE_LABELS[role];
  return {
    subject,
    ...renderEmail({
      preheader: `${email} came through the front door for the first time.`,
      heading: 'A guest came in',
      body: [`${email} came through the front door for the first time and can now see ${sees}. Their key keeps working until you remove the address.`],
      details: [
        ['Email', email],
        ['Invited as', label],
        ['IP address', ip],
      ],
      button: { label: 'Open the guest list', url: adminUrl },
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

export function investorInquiryNotification(inquiry: InquiryForEmail, adminUrl: string): Email {
  const who = inquiry.firm ? `${inquiry.name} at ${inquiry.firm}` : inquiry.name;
  const subject = `Investor inquiry from ${inquiry.firm ? `${inquiry.name}, ${inquiry.firm}` : inquiry.name}`;
  return {
    subject,
    ...renderEmail({
      preheader: `${who} wrote from the Data Room.`,
      heading: 'New investor inquiry',
      body: [`${who} wrote from the Data Room. Reply to this email to write back to them directly.`],
      details: [
        ['Name', inquiry.name],
        ['Firm or fund', inquiry.firm],
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
