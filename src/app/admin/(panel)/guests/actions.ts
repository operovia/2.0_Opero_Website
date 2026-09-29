'use server';

import { revalidatePath } from 'next/cache';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { addGuests, removeGuest } from '@/server/guests';
import { clientIp } from '@/server/request';
import { MAX_RECIPIENTS_PER_PASTE, parseRecipients } from '@/surveys/recipients';

const MAX_NOTE_LENGTH = 200;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/** Adds every address typed or pasted into the box to the guest list, with one optional note for all of them. */
export async function addGuestsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const values = formValues(formData, ['people', 'note']);
  const text = values.people ?? '';
  const note = (values.note ?? '').trim();
  if (!text.trim()) return failure('Add at least one email address.', { fieldErrors: { people: 'Add at least one email address.' }, values });
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
    note,
    user.id,
  );
  const ip = await clientIp();
  for (const email of added) {
    await audit({ id: user.id, email: user.email }, 'guest.add', { target: email, details: note ? { note } : {}, ip });
  }
  revalidatePath('/admin/guests');

  const skipped = [...parsed.invalid, ...invalid];
  const notes = [
    `Added ${plural(added.length, 'guest')}.`,
    existing.length ? `${plural(existing.length, 'address was', 'addresses were')} already on the list.` : '',
    parsed.duplicates ? `${plural(parsed.duplicates, 'address was', 'addresses were')} listed twice.` : '',
    skipped.length
      ? `Skipped ${plural(skipped.length, 'line')} without an email address: ${skipped
          .slice(0, 3)
          .map((line) => `"${line}"`)
          .join(', ')}${skipped.length > 3 ? ', and more' : ''}.`
      : '',
  ].filter(Boolean);
  // Keep only the lines that were skipped, so they can be fixed and added.
  return success(notes.join(' '), { values: { people: skipped.join('\n'), note: '' } });
}

/** Takes an address off the list. Its keys stop working on the next request. */
export async function removeGuestAction(formData: FormData): Promise<void> {
  const { user } = await requireAdmin();
  const removed = await removeGuest(String(formData.get('id') ?? ''));
  if (!removed) return;
  await audit({ id: user.id, email: user.email }, 'guest.remove', { target: removed.email, ip: await clientIp() });
  revalidatePath('/admin/guests');
}
