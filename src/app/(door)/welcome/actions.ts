'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { DOOR_ENHANCED_FIELD, DOOR_MIN_FILL_MS, type DoorAnswer } from '@/content/constants';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { sha256 } from '@/server/crypto';
import { createGuestSession, DOOR_FLOOR_MS, DOOR_LIMITS, findInvite, normalizeGuestEmail, notifyGuestEntered, recordGuestEntry } from '@/server/guests';
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/server/inquiries-fields';
import { hit, retryWording } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const EMAIL_MAX = 254;
const emailShape = z.email();

type Verdict = { open: true } | { open: false; code: DoorAnswer; wait?: string };

/**
 * Whether the address opens the door. Every miss gets one of a few codes and
 * nothing says whether the address is on the list: the spam traps and an
 * unknown address answer alike, the limits are keyed on a hash of the
 * address, and the lookup costs the same whether or not it matches.
 */
async function check(formData: FormData, typed: string): Promise<Verdict> {
  if (String(formData.get(HONEYPOT_FIELD) ?? '') !== '') return { open: false, code: 'wrong' };
  const elapsed = Number(formData.get(ELAPSED_FIELD) || NaN);
  // As the public forms' screening (src/server/inquiries.ts): a form sent faster than a person fills it was not filled in by one.
  if (Number.isFinite(elapsed) && elapsed < DOOR_MIN_FILL_MS) return { open: false, code: 'wrong' };

  const address = normalizeGuestEmail(typed);
  if (!address) return { open: false, code: 'empty' };
  if (address.length > EMAIL_MAX || !emailShape.safeParse(address).success) return { open: false, code: 'invalid' };

  const ip = await clientIp();
  const limits = await Promise.all([
    hit(`door:ip:${ip}`, DOOR_LIMITS.ip.limit, DOOR_LIMITS.ip.windowSeconds),
    hit(`door:addr:${sha256(address)}`, DOOR_LIMITS.address.limit, DOOR_LIMITS.address.windowSeconds),
  ]);
  const over = limits.filter((limit) => !limit.ok);
  if (over.length) return { open: false, code: 'limited', wait: retryWording(Math.max(...over.map((limit) => limit.retryAfterSeconds))) };

  const invite = await findInvite(address);
  if (!invite) return { open: false, code: 'wrong' };

  await createGuestSession(invite.id);
  const { firstTime } = await recordGuestEntry(invite.id);
  await audit(null, 'door.enter', { target: address, ip });
  // The owner hears about a first entry once the answer is on its way; the guest never waits on the email.
  if (firstTime) after(() => notifyGuestEntered(invite, ip));
  return { open: true };
}

/**
 * The door's one action. It answers with a code from DoorAnswer in
 * FormState.message (the door maps codes to its copy) and echoes the typed
 * address in values.email; a rate-limited answer carries the wait in
 * values.wait. With JavaScript the door plays the reveal and navigates
 * itself, so a match returns success(); without it (the hidden enhanced
 * field is empty) the match is a plain redirect to the home page.
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
    verdict = { open: false, code: 'trouble' };
  }

  // Every answer takes at least the floor, hit or miss, so its timing tells nothing.
  const remaining = started + DOOR_FLOOR_MS - Date.now();
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

  if (!verdict.open) return failure(verdict.code, { values: verdict.wait ? { ...values, wait: verdict.wait } : values });
  if (enhanced) return success();
  // redirect() throws, so it stays outside the try block.
  redirect('/');
}
