/**
 * Companies on the guest list: an email domain whose people may come in
 * through the front door after confirming their address by email
 * (src/server/guests.ts). The pure parts live here, for the server, the
 * admin and the tests alike.
 */

/**
 * Email services anyone can sign up for. A company entry for one of them
 * would let in anyone who makes an address there, so the Guests page refuses
 * them; people at such addresses are added one by one.
 */
const PUBLIC_EMAIL_DOMAINS = new Set([
  'aol.com',
  'fastmail.com',
  'gmail.com',
  'gmx.com',
  'gmx.net',
  'googlemail.com',
  'hey.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'mac.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.com',
  'yandex.com',
  'ymail.com',
  'zoho.com',
]);

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TOP_LEVEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/**
 * A company's email domain from what the owner typed: "@Example.com",
 * "example.com" and "jane@example.com" all give "example.com". Null when what is
 * left is not a domain name.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().normalize('NFC').toLowerCase();
  if (value.includes('@')) value = value.slice(value.lastIndexOf('@') + 1);
  value = value.replace(/\.$/, '');
  if (!value || value.length > 253) return null;
  const labels = value.split('.');
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label)) || !TOP_LEVEL.test(labels.at(-1)!)) return null;
  return value;
}

/** The domain of an already-normalized address: everything after its last @. */
export function domainOf(address: string): string {
  return address.slice(address.lastIndexOf('@') + 1);
}

/** Whether the domain belongs to an email service anyone can sign up for. */
export function isPublicEmailDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.has(domain);
}
