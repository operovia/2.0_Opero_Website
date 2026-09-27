'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db/client';
import { inquiries, inquiryStatuses } from '@/db/schema';
import { failure, formValues, success, type FormState } from '@/lib/forms';
import { requireAdmin } from '@/server/auth/session';
import { getInquiry } from '@/server/inquiries-admin';

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(inquiryStatuses),
  notes: z.string().max(10_000, 'Notes are limited to 10,000 characters.'),
});

export async function updateInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, ['status', 'notes']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure('That could not be saved. Check the notes and try again.', { values });
  const existing = await getInquiry(parsed.data.id);
  if (!existing) return failure('This inquiry no longer exists.');

  await db
    .update(inquiries)
    .set({
      status: parsed.data.status,
      notes: parsed.data.notes,
      ...(existing.status !== parsed.data.status ? { statusChangedAt: new Date() } : {}),
    })
    .where(eq(inquiries.id, parsed.data.id));
  revalidatePath('/admin', 'layout');
  return success('Saved.', { values });
}

export async function deleteInquiry(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (await getInquiry(id)) await db.delete(inquiries).where(eq(inquiries.id, id));
  revalidatePath('/admin', 'layout');
  redirect('/admin/inquiries');
}
