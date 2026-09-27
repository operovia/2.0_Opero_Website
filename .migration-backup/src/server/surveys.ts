import 'server-only';
import { and, asc, count, desc, eq, gt, inArray, isNotNull, isNull, notInArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { adminUsers, surveyQuestions, surveyRecipients, surveyResponses, surveys } from '@/db/schema';
import { textToRich, type RichDoc } from '@/lib/rich-text';
import { renderEmail } from '@/server/email/layout';
import { sendEmails } from '@/server/email/send';
import { emailConfig, siteUrl } from '@/server/env';
import { getSettings } from '@/server/settings';
import { randomToken } from '@/server/crypto';
import { surveyDefaults } from '@/surveys/defaults';
import { fillMergeTags } from '@/surveys/merge';
import { NEW_QUESTION, structuralChange, type QuestionDraft } from '@/surveys/questions';
import type { ParsedRecipient } from '@/surveys/recipients';
import type { ResponseForStats } from '@/surveys/stats';
import type { SurveyAnswers, SurveyQuestion, SurveyStatus } from '@/surveys/types';

export type Survey = typeof surveys.$inferSelect;
export type Recipient = typeof surveyRecipients.$inferSelect;

export const RESPONSES_PAGE_SIZE = 50;
export const MAX_RECIPIENTS = 5000;

const isUuid = (value: string) => z.uuid().safeParse(value).success;
const asDate = (value: unknown) => (value ? new Date(value as string) : null);

/* ------------------------------------------------------------------------ */
/* Reading                                                                  */
/* ------------------------------------------------------------------------ */

export async function getSurvey(id: string): Promise<Survey | null> {
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
  return row ?? null;
}

export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const [row] = await db.select().from(surveys).where(eq(surveys.slug, slug)).limit(1);
  return row ?? null;
}

export async function getQuestions(surveyId: string): Promise<SurveyQuestion[]> {
  return db
    .select({
      id: surveyQuestions.id,
      type: surveyQuestions.type,
      prompt: surveyQuestions.prompt,
      helpText: surveyQuestions.helpText,
      required: surveyQuestions.required,
      options: surveyQuestions.options,
    })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, surveyId))
    .orderBy(asc(surveyQuestions.position));
}

export async function responseCount(surveyId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
  return row?.n ?? 0;
}

export type SurveyCounts = { questions: number; responses: number; recipients: number; invited: number; opened: number; completed: number };

export async function surveyCounts(surveyId: string): Promise<SurveyCounts> {
  const [row] = await db
    .select({
      questions: sql<number>`(select count(*) from ${surveyQuestions} where ${surveyQuestions.surveyId} = ${surveyId})::int`,
      responses: sql<number>`(select count(*) from ${surveyResponses} where ${surveyResponses.surveyId} = ${surveyId})::int`,
      recipients: sql<number>`count(${surveyRecipients.id})::int`,
      invited: sql<number>`count(${surveyRecipients.invitedAt})::int`,
      opened: sql<number>`count(${surveyRecipients.openedAt})::int`,
      completed: sql<number>`count(${surveyRecipients.completedAt})::int`,
    })
    .from(surveyRecipients)
    .where(eq(surveyRecipients.surveyId, surveyId));
  return row ?? { questions: 0, responses: 0, recipients: 0, invited: 0, opened: 0, completed: 0 };
}

export type SurveyListItem = Pick<Survey, 'id' | 'title' | 'slug' | 'status' | 'createdAt' | 'anonymous' | 'openLinkEnabled'> & {
  questions: number;
  responses: number;
  recipients: number;
  lastResponseAt: Date | null;
};

export async function listSurveys(): Promise<SurveyListItem[]> {
  return db
    .select({
      id: surveys.id,
      title: surveys.title,
      slug: surveys.slug,
      status: surveys.status,
      createdAt: surveys.createdAt,
      anonymous: surveys.anonymous,
      openLinkEnabled: surveys.openLinkEnabled,
      questions: sql<number>`(select count(*) from ${surveyQuestions} where ${surveyQuestions.surveyId} = ${surveys.id})::int`,
      responses: sql<number>`(select count(*) from ${surveyResponses} where ${surveyResponses.surveyId} = ${surveys.id})::int`,
      recipients: sql<number>`(select count(*) from ${surveyRecipients} where ${surveyRecipients.surveyId} = ${surveys.id})::int`,
      lastResponseAt: sql<Date | null>`(select max(${surveyResponses.submittedAt}) from ${surveyResponses} where ${surveyResponses.surveyId} = ${surveys.id})`.mapWith(asDate),
    })
    .from(surveys)
    .orderBy(desc(surveys.createdAt));
}

/** Surveys that received responses recently, for the dashboard. */
export async function surveysWithRecentResponses(days = 30, limit = 5) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: surveys.id,
      title: surveys.title,
      status: surveys.status,
      recent: sql<number>`count(*)::int`,
      lastResponseAt: sql<Date>`max(${surveyResponses.submittedAt})`.mapWith((value) => new Date(value as string)),
    })
    .from(surveyResponses)
    .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
    .where(gt(surveyResponses.submittedAt, since))
    .groupBy(surveys.id)
    .orderBy(desc(sql`max(${surveyResponses.submittedAt})`))
    .limit(limit);
}

/* ------------------------------------------------------------------------ */
/* Creating and changing surveys                                            */
/* ------------------------------------------------------------------------ */

export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const [row] = await db.select({ id: surveys.id }).from(surveys).where(eq(surveys.slug, slug)).limit(1);
  return Boolean(row && row.id !== exceptId);
}

export async function createSurvey(input: { title: string; slug: string }, userId: string): Promise<string> {
  const [row] = await db
    .insert(surveys)
    .values({
      title: input.title,
      slug: input.slug,
      intro: textToRich(''),
      thankYou: textToRich(surveyDefaults.thankYou),
      inviteSubject: surveyDefaults.inviteSubject,
      inviteMessage: surveyDefaults.inviteMessage,
      reminderSubject: surveyDefaults.reminderSubject,
      reminderMessage: surveyDefaults.reminderMessage,
      createdBy: userId,
    })
    .returning({ id: surveys.id });
  return row!.id;
}

/** Whether personal links have gone out; after that the survey's address must not change. */
export async function invitationsSent(surveyId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: surveyRecipients.id })
    .from(surveyRecipients)
    .where(and(eq(surveyRecipients.surveyId, surveyId), isNotNull(surveyRecipients.invitedAt)))
    .limit(1);
  return Boolean(row);
}

export type SettingsInput = {
  title: string;
  slug: string;
  intro: RichDoc;
  thankYou: RichDoc;
  anonymous: boolean;
  openLinkEnabled: boolean;
};

export async function updateSurveySettings(id: string, input: SettingsInput): Promise<void> {
  await db.update(surveys).set(input).where(eq(surveys.id, id));
}

export async function updateEmailTemplates(
  id: string,
  input: { inviteSubject: string; inviteMessage: string; reminderSubject: string; reminderMessage: string },
): Promise<void> {
  await db.update(surveys).set(input).where(eq(surveys.id, id));
}

export async function setSurveyStatus(id: string, status: SurveyStatus): Promise<void> {
  await db.update(surveys).set({ status }).where(eq(surveys.id, id));
}

export async function deleteSurvey(id: string): Promise<void> {
  await db.delete(surveys).where(eq(surveys.id, id));
}

/* ------------------------------------------------------------------------ */
/* Questions                                                                */
/* ------------------------------------------------------------------------ */

export type SaveQuestionsResult = { ok: true; questions: SurveyQuestion[] } | { ok: false; error: string };

/**
 * Saves the whole question list in one go. New questions get real ids.
 * Once the survey has responses, only wording may change (see
 * structuralChange). The survey row is locked so a response cannot land
 * halfway through a restructure.
 */
export async function saveQuestions(surveyId: string, drafts: QuestionDraft[]): Promise<SaveQuestionsResult> {
  const result = await db.transaction(async (tx): Promise<SaveQuestionsResult> => {
    await tx.select({ id: surveys.id }).from(surveys).where(eq(surveys.id, surveyId)).for('update');
    const before = await tx
      .select({
        id: surveyQuestions.id,
        type: surveyQuestions.type,
        prompt: surveyQuestions.prompt,
        helpText: surveyQuestions.helpText,
        required: surveyQuestions.required,
        options: surveyQuestions.options,
      })
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(asc(surveyQuestions.position));
    const known = new Set(before.map((q) => q.id));
    if (drafts.some((d) => !known.has(d.id) && !NEW_QUESTION.test(d.id))) {
      return { ok: false, error: 'This survey changed somewhere else. Reload the page and try again.' };
    }

    const [{ n: responses } = { n: 0 }] = await tx.select({ n: count() }).from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
    if (responses > 0) {
      const refused = structuralChange(before, drafts);
      if (refused) return { ok: false, error: refused };
    }

    const kept = drafts.filter((d) => known.has(d.id)).map((d) => d.id);
    await tx
      .delete(surveyQuestions)
      .where(kept.length ? and(eq(surveyQuestions.surveyId, surveyId), notInArray(surveyQuestions.id, kept)) : eq(surveyQuestions.surveyId, surveyId));
    for (const [position, draft] of drafts.entries()) {
      const values = { position, type: draft.type, prompt: draft.prompt, helpText: draft.helpText, required: draft.required, options: draft.options };
      if (known.has(draft.id)) await tx.update(surveyQuestions).set(values).where(eq(surveyQuestions.id, draft.id));
      else await tx.insert(surveyQuestions).values({ surveyId, ...values });
    }
    await tx.update(surveys).set({ updatedAt: new Date() }).where(eq(surveys.id, surveyId));
    return { ok: true, questions: [] };
  });
  return result.ok ? { ok: true, questions: await getQuestions(surveyId) } : result;
}

/* ------------------------------------------------------------------------ */
/* Recipients and emails                                                    */
/* ------------------------------------------------------------------------ */

export async function listRecipients(surveyId: string): Promise<Recipient[]> {
  return db.select().from(surveyRecipients).where(eq(surveyRecipients.surveyId, surveyId)).orderBy(asc(surveyRecipients.createdAt), asc(surveyRecipients.email));
}

export async function addRecipients(surveyId: string, people: ParsedRecipient[]): Promise<{ added: number; existing: number; overLimit: number }> {
  if (!people.length) return { added: 0, existing: 0, overLimit: 0 };
  const [{ n: current } = { n: 0 }] = await db.select({ n: count() }).from(surveyRecipients).where(eq(surveyRecipients.surveyId, surveyId));
  const room = Math.max(0, MAX_RECIPIENTS - current);
  const batch = people.slice(0, room);
  const inserted = batch.length
    ? await db
        .insert(surveyRecipients)
        .values(batch.map((p) => ({ surveyId, name: p.name, email: p.email, token: randomToken() })))
        .onConflictDoNothing({ target: [surveyRecipients.surveyId, surveyRecipients.email] })
        .returning({ id: surveyRecipients.id })
    : [];
  return { added: inserted.length, existing: batch.length - inserted.length, overLimit: people.length - batch.length };
}

export async function removeRecipient(surveyId: string, recipientId: string): Promise<Recipient | null> {
  if (!isUuid(recipientId)) return null;
  const [row] = await db
    .delete(surveyRecipients)
    .where(and(eq(surveyRecipients.surveyId, surveyId), eq(surveyRecipients.id, recipientId)))
    .returning();
  return row ?? null;
}

export const surveyLink = (survey: Pick<Survey, 'slug'>, token?: string) => `${siteUrl()}/s/${survey.slug}${token ? `?t=${token}` : ''}`;

export type EmailKind = 'invite' | 'remind';

/** Builds one survey email for one person, from the survey's saved subject and message. */
export function surveyEmail(survey: Survey, recipient: Pick<Recipient, 'name' | 'token'>, kind: EmailKind) {
  const values = { name: recipient.name, survey: survey.title };
  const subject = fillMergeTags(kind === 'invite' ? survey.inviteSubject : survey.reminderSubject, values).replace(/\s+/g, ' ').trim();
  const message = fillMergeTags(kind === 'invite' ? survey.inviteMessage : survey.reminderMessage, values);
  return {
    subject: subject || survey.title,
    ...renderEmail({
      preheader: message.replace(/\s+/g, ' ').trim().slice(0, 140),
      heading: survey.title,
      body: message
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      button: { label: 'Take the survey', url: surveyLink(survey, recipient.token) },
      footnote: 'This link is personal to you, so please do not forward this email.',
    }),
  };
}

export type SendOutcome = { sent: number; failed: number; skipped: number; logOnly: boolean };

/**
 * Sends invitations or reminders. Invitations go to the chosen people (or
 * everyone not yet invited); reminders only to people invited who have not
 * finished. A per-survey lock stops a double click from sending twice.
 */
export async function sendSurveyEmails(survey: Survey, kind: EmailKind, recipientIds?: string[]): Promise<SendOutcome> {
  const logOnly = !emailConfig().apiKey;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`survey-send:${survey.id}`}))`);
    const ids = recipientIds?.filter(isUuid);
    const scope = [
      eq(surveyRecipients.surveyId, survey.id),
      isNull(surveyRecipients.completedAt),
      ...(ids ? [inArray(surveyRecipients.id, ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])] : []),
      ...(kind === 'remind' ? [isNotNull(surveyRecipients.invitedAt)] : ids ? [] : [isNull(surveyRecipients.invitedAt)]),
    ];
    const targets = await tx.select().from(surveyRecipients).where(and(...scope)).orderBy(asc(surveyRecipients.createdAt));
    const skipped = (ids?.length ?? targets.length) - targets.length;
    if (!targets.length) return { sent: 0, failed: 0, skipped, logOnly };

    // Replies reach a person: the configured reply-to address, or the site's contact email.
    const replyTo = emailConfig().replyTo || (await getSettings()).contactEmail;
    const results = await sendEmails(targets.map((r) => ({ to: r.email, replyTo, ...surveyEmail(survey, r, kind) })));
    const now = new Date();
    const delivered = targets.filter((_, i) => results[i]?.ok).map((r) => r.id);
    for (const [i, result] of results.entries()) if (!result.ok) console.error('[opero] Survey email not sent to', targets[i]!.email, result.error);
    if (delivered.length) {
      await tx
        .update(surveyRecipients)
        .set({
          invitedAt: sql`coalesce(${surveyRecipients.invitedAt}, ${now})`,
          lastSentAt: now,
          sendCount: sql`${surveyRecipients.sendCount} + 1`,
          ...(kind === 'remind' ? { remindedAt: now } : {}),
        })
        .where(inArray(surveyRecipients.id, delivered));
    }
    return { sent: delivered.length, failed: targets.length - delivered.length, skipped, logOnly };
  });
}

/* ------------------------------------------------------------------------ */
/* Responses                                                                */
/* ------------------------------------------------------------------------ */

export type ResponseRow = {
  id: string;
  source: 'invite' | 'open';
  answers: SurveyAnswers;
  submittedAt: Date;
  recipientName: string | null;
  recipientEmail: string | null;
};

const responseColumns = {
  id: surveyResponses.id,
  source: surveyResponses.source,
  answers: surveyResponses.answers,
  submittedAt: surveyResponses.submittedAt,
  recipientName: surveyRecipients.name,
  recipientEmail: surveyRecipients.email,
};

/** Who gave a response, as the admin may see it: nobody for anonymous surveys and open links. */
export function respondentLabel(row: Pick<ResponseRow, 'recipientName' | 'recipientEmail'>): string | null {
  if (!row.recipientEmail) return null;
  return row.recipientName ? `${row.recipientName} (${row.recipientEmail})` : row.recipientEmail;
}

/** A name for a response in lists and headings, whoever gave it. */
export function responseTitle(row: Pick<ResponseRow, 'recipientName' | 'recipientEmail' | 'source'>, anonymous: boolean): string {
  const who = respondentLabel(row);
  if (who) return who;
  if (anonymous) return 'Anonymous';
  return row.source === 'open' ? 'Open link' : 'Someone since removed from the list';
}

export async function allResponses(surveyId: string): Promise<ResponseRow[]> {
  return db
    .select(responseColumns)
    .from(surveyResponses)
    .leftJoin(surveyRecipients, eq(surveyResponses.recipientId, surveyRecipients.id))
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(desc(surveyResponses.submittedAt), asc(surveyResponses.id));
}

export function forStats(rows: ResponseRow[]): ResponseForStats[] {
  return rows.map((r) => ({ id: r.id, answers: r.answers, submittedAt: r.submittedAt, respondent: respondentLabel(r) }));
}

export async function listResponses(surveyId: string, page: number): Promise<{ rows: ResponseRow[]; total: number }> {
  const [rows, [total]] = await Promise.all([
    db
      .select(responseColumns)
      .from(surveyResponses)
      .leftJoin(surveyRecipients, eq(surveyResponses.recipientId, surveyRecipients.id))
      .where(eq(surveyResponses.surveyId, surveyId))
      .orderBy(desc(surveyResponses.submittedAt), asc(surveyResponses.id))
      .limit(RESPONSES_PAGE_SIZE)
      .offset((page - 1) * RESPONSES_PAGE_SIZE),
    db.select({ n: count() }).from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId)),
  ]);
  return { rows, total: total?.n ?? 0 };
}

export async function getResponse(surveyId: string, responseId: string): Promise<ResponseRow | null> {
  if (!isUuid(responseId)) return null;
  const [row] = await db
    .select(responseColumns)
    .from(surveyResponses)
    .leftJoin(surveyRecipients, eq(surveyResponses.recipientId, surveyRecipients.id))
    .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.id, responseId)))
    .limit(1);
  return row ?? null;
}

/** Deletes one response. A person whose response it was can use their link again. */
export async function deleteResponse(surveyId: string, responseId: string): Promise<boolean> {
  if (!isUuid(responseId)) return false;
  return db.transaction(async (tx) => {
    const [row] = await tx
      .delete(surveyResponses)
      .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.id, responseId)))
      .returning({ recipientId: surveyResponses.recipientId });
    if (!row) return false;
    if (row.recipientId) await tx.update(surveyRecipients).set({ completedAt: null }).where(eq(surveyRecipients.id, row.recipientId));
    return true;
  });
}

/** Deletes every response, for example after testing; everyone invited can respond again. */
export async function deleteAllResponses(surveyId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const removed = await tx.delete(surveyResponses).where(eq(surveyResponses.surveyId, surveyId)).returning({ id: surveyResponses.id });
    await tx.update(surveyRecipients).set({ completedAt: null }).where(eq(surveyRecipients.surveyId, surveyId));
    return removed.length;
  });
}

/* ------------------------------------------------------------------------ */
/* Admins' names on survey pages                                            */
/* ------------------------------------------------------------------------ */

export async function creatorName(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [row] = await db.select({ name: adminUsers.name, email: adminUsers.email }).from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  return row ? row.name || row.email : null;
}
