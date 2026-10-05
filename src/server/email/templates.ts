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

/** Sent the first time a guest gives their address at the front door. `company`: the domain they came in through, for someone at a company on the list. */
export function guestEnteredNotification(
  { email, role, ip, company }: { email: string; role: GuestRole; ip: string; company?: string | null },
  adminUrl: string,
): Email {
  const subject = `${email} entered the site as a guest`;
  const { label, sees } = GUEST_ROLE_LABELS[role];
  return {
    subject,
    ...renderEmail({
      preheader: `${email} came through the front door for the first time.`,
      heading: 'A guest came in',
      body: [
        company
          ? `${email} confirmed the address by email and came through the front door for the first time, as someone at @${company}. They can now see ${sees}. Their key keeps working until you remove them or the company.`
          : `${email} came through the front door for the first time and can now see ${sees}. Their key keeps working until you remove the address.`,
      ],
      details: [['Email', email], ...(company ? ([['Company', `@${company}`]] as [string, string][]) : []), ['Invited as', label], ['IP address', ip]],
      button: { label: 'Open the guest list', url: adminUrl },
    }),
  };
}

/**
 * Sent to someone at a company on the guest list who gave their address at
 * the front door: the one-time link that lets them in.
 */
export function guestConfirmLinkEmail({ email, url, hours }: { email: string; url: string; hours: number }): Email {
  const subject = 'Your link to the Opero site';
  return {
    subject,
    ...renderEmail({
      preheader: 'Open it to come in.',
      heading: 'Your link to Opero',
      body: [
        `You asked to come in to the Opero site as ${email}. Open the link below and press enter at the door: your address is already filled in.`,
        `The link works once, within ${hours} hours. To come in on another browser later, enter your address at the door again and we will send a new one.`,
      ],
      button: { label: 'Open the door', url },
      footnote: 'If you did not ask for this, you can ignore this email.',
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
