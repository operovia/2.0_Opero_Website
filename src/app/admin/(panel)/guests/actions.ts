'use server';

import { revalidatePath } from 'next/cache';
import { GUEST_ROLE_LABELS } from '@/content/constants';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { normalizeGreeting } from '@/lib/greeting';
import {
  addCompany,
  addGuests,
  isGuestRole,
  makeGuestLink,
  removeCompany,
  removeGuest,
  setCompanyGreeting,
  setCompanyRole,
  setGuestGreeting,
  setGuestRole,
} from '@/server/guests';
import { clientIp } from '@/server/request';
import { MAX_RECIPIENTS_PER_PASTE, parseRecipients } from '@/surveys/recipients';

const MAX_NOTE_LENGTH = 200;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** Adds every address typed or pasted into the box to the guest list, with one role and one optional note for all of them. */
export async function addGuestsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const values = formValues(formData, ['people', 'role', 'note']);
  const text = values.people ?? '';
  const note = (values.note ?? '').trim();
  const role = values.role;
  if (!text.trim()) return failure('Add at least one email address.', { fieldErrors: { people: 'Add at least one email address.' }, values });
  if (!isGuestRole(role)) return failure('Choose what they may see.', { fieldErrors: { role: 'Choose visitor or investor.' }, values });
  if (note.length > MAX_NOTE_LENGTH) {
    return failure('Keep the note short.', { fieldErrors: { note: `Keep the note under ${MAX_NOTE_LENGTH} characters.` }, values });
  }

  const parsed = parseRecipients(text);
  if (parsed.recipients.length > MAX_RECIPIENTS_PER_PASTE) {
    return failure(`Add up to ${MAX_RECIPIENTS_PER_PASTE.toLocaleString('en-US')} people at a time.`, { values });
  }
  if (!parsed.recipients.length) {
    return failure('None of those lines has an email address we can use.', {
      fieldErrors: { people: 'Add one person per line, with their email address.' },
      values,
    });
  }

  const { added, existing, invalid } = await addGuests(
    parsed.recipients.map((person) => person.email),
    role,
    note,
    user.id,
  );
  const ip = await clientIp();
  for (const email of added) {
    await audit({ id: user.id, email: user.email }, 'guest.add', { target: email, details: { role, ...(note ? { note } : {}) }, ip });
  }
  revalidatePath('/admin/guests');

  const skipped = [...parsed.invalid, ...invalid];
  const notes = [
    `Added ${plural(added.length, 'guest')} as ${added.length === 1 ? GUEST_ROLE_LABELS[role].label.toLowerCase() : `${GUEST_ROLE_LABELS[role].label.toLowerCase()}s`}.`,
    existing.length ? `${plural(existing.length, 'address was', 'addresses were')} already on the list and kept as they were.` : '',
    parsed.duplicates ? `${plural(parsed.duplicates, 'address was', 'addresses were')} listed twice.` : '',
    skipped.length
      ? `Skipped ${plural(skipped.length, 'line')} without an email address: ${skipped
          .slice(0, 3)
          .map((line) => `"${line}"`)
          .join(', ')}${skipped.length > 3 ? ', and more' : ''}.`
      : '',
  ].filter(Boolean);
  // Keep only the lines that were skipped, so they can be fixed and added.
  return success(notes.join(' '), { values: { people: skipped.join('\n'), role, note: '' } });
}

/** Changes what a guest may see. Takes effect on their very next request. */
export async function setGuestRoleAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const role = formData.get('role');
  if (!isGuestRole(role)) return;
  const result = await setGuestRole(String(formData.get('id') ?? ''), role);
  if (!result?.changed) return;
  await audit({ id: user.id, email: user.email }, 'guest.role', { target: result.email, details: { role }, ip: await clientIp() });
  revalidatePath('/admin/guests');
}

/** Sets the name the site welcomes a guest by, or clears it. Their personal link is made if they have none. */
export async function setGuestGreetingAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const greeting = normalizeGreeting(String(formData.get('greeting') ?? ''));
  const result = await setGuestGreeting(String(formData.get('id') ?? ''), greeting);
  if (!result) return;
  if (result.changed) await audit({ id: user.id, email: user.email }, 'guest.greeting', { target: result.email, details: { greeting }, ip: await clientIp() });
  revalidatePath('/admin/guests');
}

/** Makes a personal link for a guest added before links existed. */
export async function makeGuestLinkAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const result = await makeGuestLink(String(formData.get('id') ?? ''));
  if (!result) return;
  await audit({ id: user.id, email: user.email }, 'guest.link', { target: result.email, ip: await clientIp() });
  revalidatePath('/admin/guests');
}

/** Takes an address off the list. Its keys stop working on the next request. */
export async function removeGuestAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await removeGuest(String(formData.get('id') ?? ''));
  if (!removed) return;
  await audit({ id: user.id, email: user.email }, 'guest.remove', { target: removed.email, ip: await clientIp() });
  revalidatePath('/admin/guests');
}

/**
 * Adds a company by its email domain: anyone with an address there may come
 * in, once the link the door emails them proves the address is theirs.
 */
export async function addCompanyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const values = formValues(formData, ['domain', 'companyRole', 'companyGreeting', 'companyNote']);
  const typed = (values.domain ?? '').trim();
  const role = values.companyRole;
  const greeting = normalizeGreeting(values.companyGreeting ?? '');
  const note = (values.companyNote ?? '').trim();
  if (!typed) return failure('Add the company email domain.', { fieldErrors: { domain: 'Add the part after the @, such as example.com.' }, values });
  if (!isGuestRole(role)) return failure('Choose what they may see.', { fieldErrors: { companyRole: 'Choose visitor or investor.' }, values });
  if (note.length > MAX_NOTE_LENGTH) {
    return failure('Keep the note short.', { fieldErrors: { companyNote: `Keep the note under ${MAX_NOTE_LENGTH} characters.` }, values });
  }

  const result = await addCompany(typed, role, note, greeting, user.id);
  if (result.status === 'invalid') {
    return failure('That is not an email domain.', { fieldErrors: { domain: 'Type the part after the @, such as example.com.' }, values });
  }
  if (result.status === 'public') {
    return failure(`Anyone can make an address at ${result.domain}, so it cannot be added as a company. Add people there one by one instead.`, {
      fieldErrors: { domain: 'Email services anyone can sign up for cannot be added as a company.' },
      values,
    });
  }
  if (result.status === 'existing') return failure(`@${result.domain} is already on the list, and was kept as it was.`, { values });

  await audit({ id: user.id, email: user.email }, 'guest.company.add', {
    target: result.domain,
    details: { role, ...(greeting ? { greeting } : {}), ...(note ? { note } : {}) },
    ip: await clientIp(),
  });
  revalidatePath('/admin/guests');
  return success(
    `Added @${result.domain}. Anyone with an address there can come in as ${GUEST_ROLE_LABELS[role].label.toLowerCase()}s: the door emails them a link to confirm it.`,
    { values: { domain: '', companyRole: role, companyGreeting: '', companyNote: '' } },
  );
}

/** Changes what a company's people may see, everyone who came in through it included. Takes effect on their next request. */
export async function setCompanyRoleAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const role = formData.get('role');
  if (!isGuestRole(role)) return;
  const result = await setCompanyRole(String(formData.get('id') ?? ''), role);
  if (!result?.changed) return;
  await audit({ id: user.id, email: user.email }, 'guest.company.role', { target: result.domain, details: { role }, ip: await clientIp() });
  revalidatePath('/admin/guests');
}

/** Sets the name a company's people are welcomed by, or clears it, for everyone who came in through it too. */
export async function setCompanyGreetingAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const greeting = normalizeGreeting(String(formData.get('greeting') ?? ''));
  const result = await setCompanyGreeting(String(formData.get('id') ?? ''), greeting);
  if (!result) return;
  if (result.changed) {
    await audit({ id: user.id, email: user.email }, 'guest.company.greeting', { target: result.domain, details: { greeting }, ip: await clientIp() });
  }
  revalidatePath('/admin/guests');
}

/** Takes a company off the list, with everyone who came in through it. Their keys stop working on the next request. */
export async function removeCompanyAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await removeCompany(String(formData.get('id') ?? ''));
  if (!removed) return;
  await audit({ id: user.id, email: user.email }, 'guest.company.remove', {
    target: removed.domain,
    details: { members: removed.members },
    ip: await clientIp(),
  });
  revalidatePath('/admin/guests');
}
