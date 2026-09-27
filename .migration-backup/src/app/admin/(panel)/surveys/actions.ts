'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { failure, fieldErrors, formValues, success, type FormState } from '@/lib/forms';
import { isRichEmpty, richDocSchema } from '@/lib/rich-text';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { clientIp } from '@/server/request';
import {
  addRecipients,
  createSurvey,
  deleteAllResponses,
  deleteResponse,
  deleteSurvey,
  getQuestions,
  getSurvey,
  invitationsSent,
  removeRecipient,
  responseCount,
  saveQuestions,
  sendSurveyEmails,
  setSurveyStatus,
  slugTaken,
  updateEmailTemplates,
  updateSurveySettings,
  type EmailKind,
} from '@/server/surveys';
import { questionListSchema, slugify, slugSchema } from '@/surveys/questions';
import { MAX_RECIPIENTS_PER_PASTE, parseRecipients } from '@/surveys/recipients';
import { surveyStatusLabels, type SurveyQuestion, type SurveyStatus } from '@/surveys/types';

export type ActionResult = { ok: boolean; message: string; errors?: Record<string, string> };

const titleSchema = z.string().trim().min(1, 'Give the survey a title.').max(120, 'Keep the title under 120 characters.');

async function actor() {
  const { user } = await requireAdmin();
  return { user, who: { id: user.id, email: user.email }, ip: await clientIp() };
}

function refresh(id: string) {
  revalidatePath(`/admin/surveys/${id}`, 'layout');
  revalidatePath('/admin/surveys');
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/* ------------------------------------------------------------------------ */
/* Creating                                                                 */
/* ------------------------------------------------------------------------ */

export async function createSurveyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, who, ip } = await actor();
  const values = formValues(formData, ['title', 'slug']);
  const title = titleSchema.safeParse(values.title ?? '');
  const slug = slugSchema.safeParse(values.slug?.trim() || slugify(values.title ?? ''));
  const errors: Record<string, string> = {};
  if (!title.success) errors.title = title.error.issues[0]!.message;
  if (!slug.success) errors.slug = values.slug?.trim() ? slug.error.issues[0]!.message : 'Choose a web address for the survey.';
  else if (await slugTaken(slug.data)) errors.slug = 'Another survey already uses this address.';
  if (!title.success || !slug.success || Object.keys(errors).length) return failure('Check the highlighted fields.', { fieldErrors: errors, values });

  const id = await createSurvey({ title: title.data, slug: slug.data }, user.id);
  await audit(who, 'survey.create', { target: title.data, ip });
  revalidatePath('/admin/surveys');
  redirect(`/admin/surveys/${id}`);
}

/* ------------------------------------------------------------------------ */
/* Questions                                                                */
/* ------------------------------------------------------------------------ */

export async function saveQuestionsAction(surveyId: string, input: unknown): Promise<ActionResult & { questions?: SurveyQuestion[] }> {
  await actor();
  const survey = await getSurvey(surveyId);
  if (!survey) return { ok: false, message: 'This survey no longer exists.' };
  const parsed = questionListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Some questions need attention. Check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const result = await saveQuestions(surveyId, parsed.data);
  if (!result.ok) return { ok: false, message: result.error };
  refresh(surveyId);
  return {
    ok: true,
    message: survey.status === 'open' ? 'Questions saved. The survey is open, so people see these changes now.' : 'Questions saved.',
    questions: result.questions,
  };
}

/* ------------------------------------------------------------------------ */
/* Settings                                                                 */
/* ------------------------------------------------------------------------ */

const settingsSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  intro: richDocSchema,
  thankYou: richDocSchema.refine((doc) => !isRichEmpty(doc), 'Write a thank-you message.'),
  anonymous: z.boolean(),
  openLinkEnabled: z.boolean(),
});

export async function saveSurveySettingsAction(surveyId: string, input: unknown): Promise<ActionResult> {
  await actor();
  const survey = await getSurvey(surveyId);
  if (!survey) return { ok: false, message: 'This survey no longer exists.' };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Check the highlighted fields.', errors: fieldErrors(parsed.error) };
  const next = parsed.data;

  const [responses, sent] = await Promise.all([responseCount(surveyId), invitationsSent(surveyId)]);
  if (next.slug !== survey.slug) {
    if (sent || responses) return { ok: false, message: 'Check the highlighted fields.', errors: { slug: 'The address cannot change once invitations have gone out or responses have arrived, or links people have would stop working.' } };
    if (await slugTaken(next.slug, surveyId)) return { ok: false, message: 'Check the highlighted fields.', errors: { slug: 'Another survey already uses this address.' } };
  }
  if (next.anonymous !== survey.anonymous && responses) {
    return { ok: false, message: 'Check the highlighted fields.', errors: { anonymous: 'Anonymity cannot change once responses have arrived.' } };
  }

  await updateSurveySettings(surveyId, next);
  refresh(surveyId);
  return { ok: true, message: 'Settings saved.' };
}

const templateSchema = z.object({
  inviteSubject: z.string().trim().min(1, 'Write a subject line.').max(200, 'Keep the subject under 200 characters.'),
  inviteMessage: z.string().trim().min(1, 'Write a message.').max(5000, 'Keep the message under 5,000 characters.'),
  reminderSubject: z.string().trim().min(1, 'Write a subject line.').max(200, 'Keep the subject under 200 characters.'),
  reminderMessage: z.string().trim().min(1, 'Write a message.').max(5000, 'Keep the message under 5,000 characters.'),
});

export async function saveEmailTemplatesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await actor();
  const surveyId = String(formData.get('surveyId') ?? '');
  const values = formValues(formData, ['inviteSubject', 'inviteMessage', 'reminderSubject', 'reminderMessage']);
  if (!(await getSurvey(surveyId))) return failure('This survey no longer exists.');
  const parsed = templateSchema.safeParse(values);
  if (!parsed.success) return failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values });
  await updateEmailTemplates(surveyId, parsed.data);
  refresh(surveyId);
  return success('Email wording saved.', { values });
}

/* ------------------------------------------------------------------------ */
/* Status and deletion                                                      */
/* ------------------------------------------------------------------------ */

export async function setStatusAction(surveyId: string, status: SurveyStatus): Promise<ActionResult> {
  const { who, ip } = await actor();
  const survey = await getSurvey(surveyId);
  if (!survey) return { ok: false, message: 'This survey no longer exists.' };
  if (!['open', 'closed'].includes(status) || status === survey.status) return { ok: false, message: 'That change is not available.' };
  if (status === 'open' && !(await getQuestions(surveyId)).length) return { ok: false, message: 'Add at least one question before opening the survey.' };
  await setSurveyStatus(surveyId, status);
  await audit(who, 'survey.status', { target: survey.title, details: { note: `${surveyStatusLabels[survey.status]} to ${surveyStatusLabels[status]}` }, ip });
  refresh(surveyId);
  return { ok: true, message: status === 'open' ? 'The survey is open for responses.' : 'The survey is closed. No more responses are accepted.' };
}

export async function deleteSurveyAction(formData: FormData): Promise<void> {
  const { who, ip } = await actor();
  const survey = await getSurvey(String(formData.get('surveyId') ?? ''));
  if (survey) {
    await deleteSurvey(survey.id);
    await audit(who, 'survey.delete', { target: survey.title, ip });
  }
  revalidatePath('/admin', 'layout');
  redirect('/admin/surveys');
}

/* ------------------------------------------------------------------------ */
/* Recipients and emails                                                    */
/* ------------------------------------------------------------------------ */

export async function addRecipientsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await actor();
  const surveyId = String(formData.get('surveyId') ?? '');
  const text = String(formData.get('people') ?? '');
  if (!(await getSurvey(surveyId))) return failure('This survey no longer exists.');
  if (!text.trim()) return failure('Add at least one email address.', { fieldErrors: { people: 'Add at least one email address.' }, values: { people: text } });

  const parsed = parseRecipients(text);
  if (parsed.recipients.length > MAX_RECIPIENTS_PER_PASTE) {
    return failure(`Add up to ${MAX_RECIPIENTS_PER_PASTE.toLocaleString('en-US')} people at a time.`, { values: { people: text } });
  }
  if (!parsed.recipients.length) {
    return failure('None of those lines has an email address we can use.', { fieldErrors: { people: 'Add one person per line, with their email address.' }, values: { people: text } });
  }

  const { added, existing, overLimit } = await addRecipients(surveyId, parsed.recipients);
  refresh(surveyId);
  const notes = [
    `Added ${plural(added, 'person', 'people')}.`,
    existing ? `${plural(existing, 'person was', 'people were')} already on the list.` : '',
    parsed.duplicates ? `${plural(parsed.duplicates, 'address was', 'addresses were')} listed twice.` : '',
    overLimit ? `${plural(overLimit, 'person was', 'people were')} not added, because a survey can have up to 5,000 recipients.` : '',
    parsed.invalid.length ? `Skipped ${plural(parsed.invalid.length, 'line')} without an email address: ${parsed.invalid.slice(0, 3).map((l) => `"${l}"`).join(', ')}${parsed.invalid.length > 3 ? ', and more' : ''}.` : '',
  ].filter(Boolean);
  // Keep only the lines that were skipped, so they can be fixed and added.
  return success(notes.join(' '), { values: { people: parsed.invalid.join('\n') } });
}

export async function removeRecipientAction(surveyId: string, recipientId: string): Promise<ActionResult> {
  await actor();
  const removed = await removeRecipient(surveyId, recipientId);
  refresh(surveyId);
  return removed ? { ok: true, message: `Removed ${removed.email}.` } : { ok: false, message: 'That person was already removed.' };
}

export async function sendEmailsAction(surveyId: string, kind: EmailKind, recipientIds?: string[]): Promise<ActionResult> {
  const { who, ip } = await actor();
  const survey = await getSurvey(surveyId);
  if (!survey) return { ok: false, message: 'This survey no longer exists.' };
  if (survey.status !== 'open') return { ok: false, message: 'Open the survey before sending emails, so the links work when people click them.' };

  const outcome = await sendSurveyEmails(survey, kind, recipientIds);
  const noun = kind === 'invite' ? 'invitation' : 'reminder';
  if (!outcome.sent && !outcome.failed) {
    return { ok: false, message: kind === 'invite' ? 'Everyone on the list has already been invited or has responded.' : 'No reminders to send. Reminders go to people who were invited and have not responded yet.' };
  }
  await audit(who, 'survey.send', { target: survey.title, details: { note: `${plural(outcome.sent, noun)} sent${outcome.failed ? `, ${outcome.failed} failed` : ''}` }, ip });
  refresh(surveyId);
  const parts = [
    outcome.logOnly
      ? `Email is not set up yet (RESEND_API_KEY is missing), so ${plural(outcome.sent, noun)} went to the server log instead of inboxes.`
      : `Sent ${plural(outcome.sent, noun)}.`,
    outcome.failed ? `${plural(outcome.failed, 'email')} could not be sent; the server log has the details.` : '',
    outcome.skipped ? `Skipped ${plural(outcome.skipped, 'person', 'people')} who already responded.` : '',
  ].filter(Boolean);
  return { ok: outcome.failed === 0, message: parts.join(' ') };
}

/* ------------------------------------------------------------------------ */
/* Responses                                                                */
/* ------------------------------------------------------------------------ */

export async function deleteResponseAction(formData: FormData): Promise<void> {
  const { who, ip } = await actor();
  const survey = await getSurvey(String(formData.get('surveyId') ?? ''));
  if (!survey) redirect('/admin/surveys');
  if (await deleteResponse(survey.id, String(formData.get('responseId') ?? ''))) {
    await audit(who, 'survey.responses.delete', { target: survey.title, details: { note: '1 response' }, ip });
  }
  refresh(survey.id);
  redirect(`/admin/surveys/${survey.id}/responses`);
}

export async function deleteAllResponsesAction(surveyId: string): Promise<ActionResult> {
  const { who, ip } = await actor();
  const survey = await getSurvey(surveyId);
  if (!survey) return { ok: false, message: 'This survey no longer exists.' };
  const removed = await deleteAllResponses(surveyId);
  if (removed) await audit(who, 'survey.responses.delete', { target: survey.title, details: { note: plural(removed, 'response') }, ip });
  refresh(surveyId);
  return { ok: true, message: removed ? `Deleted ${plural(removed, 'response')}. Everyone invited can respond again.` : 'There were no responses to delete.' };
}
