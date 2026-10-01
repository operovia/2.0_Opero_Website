'use server';

import { revalidatePath } from 'next/cache';
import { GUEST_ROLE_LABELS } from '@/content/constants';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { addGuests, isGuestRole, removeGuest, setGuestRole } from '@/server/guests';
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

/** Takes an address off the list. Its keys stop working on the next request. */
export async function removeGuestAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await removeGuest(String(formData.get('id') ?? ''));
  if (!removed) return;
  await audit({ id: user.id, email: user.email }, 'guest.remove', { target: removed.email, ip: await clientIp() });
  revalidatePath('/admin/guests');
}
