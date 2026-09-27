import 'server-only';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { surveyRecipients, surveyResponses, surveys } from '@/db/schema';
import { randomToken, sha256 } from '@/server/crypto';
import { isHttps } from '@/server/request';
import { getQuestions, getSurveyBySlug, type Survey } from '@/server/surveys';
import type { SurveyAnswers, SurveyQuestion } from '@/surveys/types';

/**
 * A random key for this browser, kept in a cookie, so an open link can
 * refuse a second response from the same browser. Best effort only: a
 * different browser or cleared cookies can respond again.
 */
export const RESPONDENT_COOKIE = 'opero_rk';

const TOKEN = /^[A-Za-z0-9_-]{43,128}$/;

const clientKeyFor = (respondentKey: string, surveyId: string) => sha256(`${respondentKey}:${surveyId}`);

async function readRespondentKey(): Promise<string | null> {
  const value = (await cookies()).get(RESPONDENT_COOKIE)?.value;
  return value && TOKEN.test(value) ? value : null;
}

/** Returns this browser's respondent key, creating the cookie if needed. Call only from a Server Action. */
async function respondentKey(): Promise<string> {
  const existing = await readRespondentKey();
  if (existing) return existing;
  const key = randomToken();
  (await cookies()).set(RESPONDENT_COOKIE, key, {
    httpOnly: true,
    secure: await isHttps(),
    sameSite: 'lax',
    path: '/s',
    maxAge: 365 * 24 * 60 * 60,
  });
  return key;
}

export type PublicView =
  | { kind: 'form'; survey: Survey; questions: SurveyQuestion[]; token: string | null; preview: boolean }
  | { kind: 'closed'; survey: Survey }
  | { kind: 'invite-only'; survey: Survey }
  | { kind: 'bad-link'; survey: Survey }
  | { kind: 'done'; survey: Survey };

/**
 * What a visitor to /s/[slug] should see. Drafts do not exist for the
 * public; `preview` (already checked to be an admin) shows any survey
 * without saving answers.
 */
export async function publicView(slug: string, token: string | null, preview: boolean): Promise<PublicView | null> {
  const survey = await getSurveyBySlug(slug);
  if (!survey) return null;
  if (preview) return { kind: 'form', survey, questions: await getQuestions(survey.id), token: null, preview: true };
  if (survey.status === 'draft') return null;
  if (survey.status === 'closed') return { kind: 'closed', survey };

  if (token) {
    const recipient = TOKEN.test(token)
      ? (await db.select().from(surveyRecipients).where(and(eq(surveyRecipients.token, token), eq(surveyRecipients.surveyId, survey.id))).limit(1))[0]
      : undefined;
    if (!recipient) return { kind: 'bad-link', survey };
    if (recipient.completedAt) return { kind: 'done', survey };
    return { kind: 'form', survey, questions: await getQuestions(survey.id), token, preview: false };
  }

  if (!survey.openLinkEnabled) return { kind: 'invite-only', survey };
  const key = await readRespondentKey();
  if (key) {
    const [previous] = await db
      .select({ id: surveyResponses.id })
      .from(surveyResponses)
      .where(and(eq(surveyResponses.surveyId, survey.id), eq(surveyResponses.clientKey, clientKeyFor(key, survey.id))))
      .limit(1);
    if (previous) return { kind: 'done', survey };
  }
  return { kind: 'form', survey, questions: await getQuestions(survey.id), token: null, preview: false };
}

/** Records the first time someone opened their personal link. Runs from the page, so link scanners in mail systems do not count. */
export async function markOpened(token: string): Promise<void> {
  if (!TOKEN.test(token)) return;
  await db.update(surveyRecipients).set({ openedAt: new Date() }).where(and(eq(surveyRecipients.token, token), isNull(surveyRecipients.openedAt)));
}

export type SubmitOutcome = 'saved' | 'duplicate' | 'closed' | 'bad-link';

/**
 * Saves a response. A personal link submits once (the recipient row is
 * locked while checking); an open link refuses a second response from the
 * same browser. Anonymous surveys never link a response to its recipient
 * and keep only the day it arrived.
 */
export async function saveResponse(surveyId: string, token: string | null, answers: SurveyAnswers): Promise<SubmitOutcome> {
  const key = token ? null : await respondentKey();
  return db.transaction(async (tx) => {
    // Shares the survey row with other responses, but waits for a question restructure to finish.
    const [survey] = await tx.select().from(surveys).where(eq(surveys.id, surveyId)).for('share');
    if (!survey || survey.status !== 'open') return 'closed';
    const submittedAt = survey.anonymous ? sql`date_trunc('day', now())` : sql`now()`;

    if (token) {
      if (!TOKEN.test(token)) return 'bad-link';
      const [recipient] = await tx
        .select()
        .from(surveyRecipients)
        .where(and(eq(surveyRecipients.token, token), eq(surveyRecipients.surveyId, surveyId)))
        .for('update');
      if (!recipient) return 'bad-link';
      if (recipient.completedAt) return 'duplicate';
      await tx.insert(surveyResponses).values({ surveyId, recipientId: survey.anonymous ? null : recipient.id, source: 'invite', answers, submittedAt });
      const now = new Date();
      await tx
        .update(surveyRecipients)
        .set({ completedAt: now, openedAt: sql`coalesce(${surveyRecipients.openedAt}, ${now})` })
        .where(eq(surveyRecipients.id, recipient.id));
      return 'saved';
    }

    if (!survey.openLinkEnabled) return 'bad-link';
    const clientKey = clientKeyFor(key!, surveyId);
    // One at a time per browser, so a double click cannot slip two responses in.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`survey-open:${clientKey}`}))`);
    const [previous] = await tx
      .select({ id: surveyResponses.id })
      .from(surveyResponses)
      .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.clientKey, clientKey)))
      .limit(1);
    if (previous) return 'duplicate';
    await tx.insert(surveyResponses).values({ surveyId, source: 'open', answers, clientKey, submittedAt });
    return 'saved';
  });
}
