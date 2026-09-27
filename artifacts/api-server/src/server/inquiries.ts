import { z } from 'zod';
import { db } from '@workspace/db';
import { inquiries } from '@workspace/db';
import { sendEmails } from '@/server/email/send';
import { demoRequestNotification, partnerApplicationNotification } from '@/server/email/templates';
import { siteUrl } from '@/server/env';
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/server/inquiries-fields';
import { hit } from '@/server/rate-limit';
import { clientIp } from '@/server/request';
import { getSettings, notificationRecipients } from '@/server/settings';

/* ------------------------------------------------------------------------ */
/* Validation                                                               */
/* ------------------------------------------------------------------------ */

const required = (label: string, max: number) => z.string().trim().min(1, `Enter your ${label}.`).max(max, `Keep this under ${max} characters.`);
const optional = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`).default('');

/** Whole numbers typed however people type them: "250,000", "250000", " 1,200 ". Empty is fine. */
const count = z
  .string()
  .trim()
  .default('')
  .transform((v) => v.replace(/[,\s]/g, ''))
  .refine((v) => v === '' || /^\d{1,10}$/.test(v), 'Enter a whole number, like 250,000.')
  .transform((v) => (v === '' ? null : Number(v)))
  .refine((v) => v === null || v <= 2_000_000_000, 'That number is too large.');

const contact = {
  name: required('name', 120),
  firm: required('firm', 160),
  email: z.string().trim().toLowerCase().max(254).email('Enter a valid email address.'),
  // Any common way of writing a number: "(734) 555-0100", "+1 734.555.0100", "734-555-0100 ext. 12".
  phone: optional(40).refine((v) => {
    if (v === '') return true;
    const digits = v.replace(/\D/g, '').length;
    return /^[\d\s().+\-#extEXT:]+$/.test(v) && digits >= 7 && digits <= 18;
  }, 'Enter a phone number, or leave it empty.'),
};

export const demoRequestSchema = z.object({ ...contact, message: optional(3000) });

export const partnerApplicationSchema = z.object({
  ...contact,
  role: required('role', 120),
  commercialSqft: count,
  residentialUnits: count,
  systems: optional(3000),
  interest: z.string().trim().min(1, 'Tell us why you are interested.').max(4000, 'Keep this under 4,000 characters.'),
});

/* ------------------------------------------------------------------------ */
/* Spam protection                                                          */
/* ------------------------------------------------------------------------ */

const MIN_FILL_MS = 2500;

export type Screening = { verdict: 'ok' } | { verdict: 'bot' } | { verdict: 'limited'; retryAfterSeconds: number };

export async function screen(formData: FormData, kind: 'demo' | 'partner', email: string): Promise<Screening> {
  if (String(formData.get(HONEYPOT_FIELD) ?? '') !== '') return { verdict: 'bot' };
  const elapsed = Number(formData.get(ELAPSED_FIELD) || NaN);
  if (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS) return { verdict: 'bot' };

  const ip = await clientIp();
  const byIp = await hit(`${kind}:ip:${ip}`, 5, 10 * 60);
  const byEmail = await hit(`${kind}:email:${email}`, 3, 24 * 60 * 60);
  if (!byIp.ok || !byEmail.ok) return { verdict: 'limited', retryAfterSeconds: Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) };
  return { verdict: 'ok' };
}

/* ------------------------------------------------------------------------ */
/* Storage and notification                                                 */
/* ------------------------------------------------------------------------ */

type DemoInput = z.infer<typeof demoRequestSchema>;
type PartnerInput = z.infer<typeof partnerApplicationSchema>;

async function notify(build: (adminUrl: string, label: string) => ReturnType<typeof demoRequestNotification>, id: string, replyTo: string) {
  const settings = await getSettings();
  const adminUrl = `${siteUrl()}/admin/inquiries/${id}`;
  const message = build(adminUrl, settings.partnerProgramLabel);
  const results = await sendEmails(notificationRecipients(settings).map((to) => ({ to, replyTo, ...message })));
  for (const result of results) if (!result.ok) console.error('[opero] Could not send an inquiry notification:', result.error);
}

export async function createDemoRequest(input: DemoInput): Promise<string> {
  const [row] = await db
    .insert(inquiries)
    .values({ type: 'demo', name: input.name, firm: input.firm, email: input.email, phone: input.phone, message: input.message })
    .returning({ id: inquiries.id });
  await notify((url) => demoRequestNotification(input, url), row!.id, input.email);
  return row!.id;
}

export async function createPartnerApplication(input: PartnerInput): Promise<string> {
  const [row] = await db
    .insert(inquiries)
    .values({
      type: 'partner',
      name: input.name,
      firm: input.firm,
      email: input.email,
      phone: input.phone,
      role: input.role,
      commercialSqft: input.commercialSqft,
      residentialUnits: input.residentialUnits,
      systems: input.systems,
      interest: input.interest,
    })
    .returning({ id: inquiries.id });
  await notify((url, label) => partnerApplicationNotification(input, url, label), row!.id, input.email);
  return row!.id;
}
