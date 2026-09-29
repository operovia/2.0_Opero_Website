'use server';

import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { media, siteSettings } from '@/db/schema';
import { failure, fieldErrors, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { changeContent } from '@/server/content-version';
import { clientIp } from '@/server/request';
import { getSettings } from '@/server/settings';

const emailList = z
  .string()
  .transform((value) => [...new Set(value.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))])
  .pipe(z.array(z.string().email('One of the recipients is not a valid email address.')).max(20, 'Add at most 20 recipients.'));

const schema = z.object({
  siteName: z.string().trim().min(1, 'Enter a site name.').max(80),
  contactEmail: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  notificationRecipients: emailList,
  partnerProgramLabel: z.string().trim().min(2, 'Enter a label, such as design partner.').max(40, 'Keep the label under 40 characters.'),
  // Absent when the picker is disabled (no images uploaded yet).
  socialImageId: z
    .string()
    .optional()
    .transform((v) => v || null)
    .pipe(z.string().uuid('Choose an image from the list.').nullable()),
  homeMetaTitle: z.string().trim().min(1, 'Enter a title for search results.').max(120),
  homeMetaDescription: z.string().trim().min(1, 'Enter a description for search results.').max(320),
  analyticsSnippet: z.string().max(10_000, 'The snippet is too long.'),
  maintenanceMode: z.literal('on').optional().transform(Boolean),
});

const fields = [
  'siteName',
  'contactEmail',
  'notificationRecipients',
  'partnerProgramLabel',
  'socialImageId',
  'homeMetaTitle',
  'homeMetaDescription',
  'analyticsSnippet',
  'maintenanceMode',
] as const;

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  // Echo what was submitted so the form keeps it after React resets the fields.
  const values = { maintenanceMode: '', ...formValues(formData, fields) };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values });
  const next = parsed.data;

  if (next.socialImageId) {
    const [image] = await db.select({ id: media.id }).from(media).where(eq(media.id, next.socialImageId)).orderBy(desc(media.createdAt)).limit(1);
    if (!image) return failure('That image is no longer in the media library.', { fieldErrors: { socialImageId: 'Choose another image.' }, values });
  }

  const before = await getSettings();
  const changed = (Object.keys(next) as (keyof typeof next)[]).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(next[key]),
  );

  await changeContent((tx) => tx.update(siteSettings).set({ ...next, updatedBy: user.id }).where(eq(siteSettings.id, 1)));
  await audit({ id: user.id, email: user.email }, 'settings.update', { details: { changed }, ip: await clientIp() });
  return success(changed.length ? 'Settings saved. The public site is updated.' : 'No changes to save.', { values });
}
