'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { DOOR_CONFIRM_PARAM, DOOR_ENHANCED_FIELD, DOOR_MIN_FILL_MS, DOOR_SENT, type DoorAnswer } from '@/content/constants';
import { domainOf } from '@/lib/guest-domains';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { getSession } from '@/server/auth/session';
import { sha256 } from '@/server/crypto';
import {
  createGuestSession,
  DOOR_FLOOR_MS,
  DOOR_LIMITS,
  findCompany,
  findInvite,
  normalizeGuestEmail,
  notifyGuestEntered,
  recordGuestEntry,
  sendConfirmLink,
  spendConfirmation,
  startConfirmation,
  type InviteMatch,
} from '@/server/guests';
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/server/inquiries-fields';
import { hit, retryWording, type RateLimitResult } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const EMAIL_MAX = 254;
const emailShape = z.email();

/** The door opens, emails a link to the address (someone at a company on the list), or answers a miss with one of a few codes. */
type Verdict = { kind: 'open' } | { kind: 'sent' } | { kind: 'miss'; code: DoorAnswer; wait?: string };

const OPEN: Verdict = { kind: 'open' };
const SENT: Verdict = { kind: 'sent' };
const miss = (code: DoorAnswer): Verdict => ({ kind: 'miss', code });
const limited = (result: RateLimitResult): Verdict => ({ kind: 'miss', code: 'limited', wait: retryWording(result.retryAfterSeconds) });

/** Lets a guest in: their key for this browser, their visit on the list, and, the first time, a word to the owner. */
async function enter(invite: InviteMatch, ip: string): Promise<Verdict> {
  await createGuestSession(invite.id);
  const { firstTime } = await recordGuestEntry(invite.id);
  await audit(null, 'door.enter', { target: invite.email, ip, ...(invite.company ? { details: { company: invite.company } } : {}) });
  // The owner hears about a first entry once the answer is on its way; the guest never waits on the email.
  if (firstTime) after(() => notifyGuestEntered(invite, ip));
  return OPEN;
}

/**
 * Emails a one-time link to someone at a company on the list. The door
 * cannot know the address is theirs, so only the link lets them in. A few
 * links an hour per address, and a few dozen per company, so nobody can make
 * the site send mail at will.
 */
async function sendLink(address: string, companyId: string, ip: string): Promise<Verdict> {
  const byAddress = await hit(`door:link:${sha256(address)}`, DOOR_LIMITS.link.limit, DOOR_LIMITS.link.windowSeconds);
  if (!byAddress.ok) return limited(byAddress);
  const byCompany = await hit(`door:company:${companyId}`, DOOR_LIMITS.company.limit, DOOR_LIMITS.company.windowSeconds);
  if (!byCompany.ok) return limited(byCompany);
  const token = await startConfirmation(address, companyId);
  // Sent before the door answers, so it only says to check the inbox once the email service has the email.
  if (!(await sendConfirmLink(address, token))) return miss('trouble');
  await audit(null, 'door.link', { target: address, ip });
  return SENT;
}

/**
 * Whether the address opens the door. An address on the list opens it by
 * itself. Someone at a company on the list comes in with the link the door
 * emails them, given back here with their address; without one, the door
 * emails a new one, on every browser, so knowing an address there is never
 * enough. Every miss gets one of a few codes and nothing says whether the
 * address is on the list: the spam traps and an unknown address answer
 * alike, the limits are keyed on the caller and on a hash of the address,
 * and the lookup costs the same whether or not it matches. Every try counts
 * against the caller; only misses count against the address.
 */
async function check(formData: FormData, typed: string): Promise<Verdict> {
  if (String(formData.get(HONEYPOT_FIELD) ?? '') !== '') return miss('wrong');
  const elapsed = Number(formData.get(ELAPSED_FIELD) || NaN);
  // As the public forms' screening (src/server/inquiries.ts): a form sent faster than a person fills it was not filled in by one.
  if (Number.isFinite(elapsed) && elapsed < DOOR_MIN_FILL_MS) return miss('wrong');

  const address = normalizeGuestEmail(typed);
  if (!address) return miss('empty');
  if (address.length > EMAIL_MAX || !emailShape.safeParse(address).success) return miss('invalid');

  // A signed-in admin at the door is previewing a guest's personal link. They are in already: an address on the
  // list, or at a company on it, opens without a guest key or an email, and their tries count against neither
  // limit, so the guest's first visit and their tries stay the guest's own.
  if (await getSession()) return (await findInvite(address)) || (await findCompany(domainOf(address))) ? OPEN : miss('wrong');

  const ip = await clientIp();
  const byIp = await hit(`door:ip:${ip}`, DOOR_LIMITS.ip.limit, DOOR_LIMITS.ip.windowSeconds);
  if (!byIp.ok) return limited(byIp);

  // A link the door emailed, given back with the address it went to: it lets them in, once.
  const token = String(formData.get(DOOR_CONFIRM_PARAM) ?? '');
  const confirmed = token ? await spendConfirmation(token, address) : null;
  if (confirmed) return enter(confirmed, ip);

  const invite = await findInvite(address);
  if (invite && !invite.companyId) return enter(invite, ip);

  // Someone at a company on the list, new or back on another browser: a link by email.
  const company = await findCompany(domainOf(address));
  if (company) return sendLink(address, company.id, ip);

  // Only a miss counts against the address. An address that opens may be shared, as a forwarded invitation
  // is, and everyone holding it gets in; getting in says the address is on the list anyway.
  const byAddress = await hit(`door:addr:${sha256(address)}`, DOOR_LIMITS.address.limit, DOOR_LIMITS.address.windowSeconds);
  return byAddress.ok ? miss('wrong') : limited(byAddress);
}

/**
 * The door's one action. A miss answers with a code from DoorAnswer in
 * FormState.message (the door maps codes to its copy) and echoes the typed
 * address in values.email; a rate-limited answer carries the wait in
 * values.wait. An emailed link answers success with DOOR_SENT, with or
 * without JavaScript, and the door says to check the inbox. With JavaScript
 * the door plays the reveal and navigates itself, so a match returns
 * success(); without it (the hidden enhanced field is empty) the match is a
 * plain redirect to the home page.
 */
export async function enterDoor(_prev: FormState, formData: FormData): Promise<FormState> {
  const started = Date.now();
  const values = formValues(formData, ['email']);
  const enhanced = formData.get(DOOR_ENHANCED_FIELD) === '1';

  let verdict: Verdict;
  try {
    verdict = await check(formData, values.email ?? '');
  } catch (error) {
    console.error('[opero] The door could not check an address', error);
    verdict = miss('trouble');
  }

  // Every answer takes at least the floor, hit or miss, so its timing tells nothing.
  const remaining = started + DOOR_FLOOR_MS - Date.now();
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

  if (verdict.kind === 'miss') return failure(verdict.code, { values: verdict.wait ? { ...values, wait: verdict.wait } : values });
  if (verdict.kind === 'sent') return success(DOOR_SENT, { values });
  if (enhanced) return success();
  // redirect() throws, so it stays outside the try block.
  redirect('/');
}
