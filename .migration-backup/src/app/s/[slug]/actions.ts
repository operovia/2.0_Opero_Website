'use server';

import { getSession } from '@/server/auth/session';
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/server/inquiries-fields';
import { hit, retryWording } from '@/server/rate-limit';
import { clientIp } from '@/server/request';
import { markOpened, saveResponse } from '@/server/survey-responses';
import { getQuestions, getSurvey } from '@/server/surveys';
import { readAnswers, type AnswerEcho } from '@/surveys/answers';

export type SurveyFormState = {
  status: 'idle' | 'error' | 'submitted' | 'duplicate';
  message?: string;
  errors?: Record<string, string>;
  echo?: AnswerEcho;
};

/* Open-link responses sent faster than this after the page opened are treated as automated. */
const MIN_FILL_MS = 1500;

export async function submitSurvey(_prev: SurveyFormState, formData: FormData): Promise<SurveyFormState> {
  const survey = await getSurvey(String(formData.get('survey') ?? ''));
  if (!survey) return { status: 'error', message: 'This survey is no longer available.' };
  const token = String(formData.get('t') ?? '') || null;
  const preview = formData.get('preview') === '1' && Boolean(await getSession());

  // Bots fill the hidden field or answer instantly; they are told it worked and nothing is saved.
  if (String(formData.get(HONEYPOT_FIELD) ?? '') !== '') return { status: 'submitted' };
  const elapsed = Number(formData.get(ELAPSED_FIELD) || NaN);
  if (!token && !preview && Number.isFinite(elapsed) && elapsed < MIN_FILL_MS) return { status: 'submitted' };

  const questions = await getQuestions(survey.id);
  const { answers, errors, echo } = readAnswers(questions, (field) => formData.getAll(field).filter((v): v is string => typeof v === 'string'));
  if (Object.keys(errors).length) {
    const count = Object.keys(errors).length;
    return { status: 'error', message: count === 1 ? 'One question needs your attention.' : `${count} questions need your attention.`, errors, echo };
  }
  if (preview) return { status: 'submitted' };

  if (!token) {
    const limit = await hit(`survey:${survey.id}:ip:${await clientIp()}`, 30, 10 * 60);
    if (!limit.ok) return { status: 'error', message: `Too many responses have come from your network. Try again in ${retryWording(limit.retryAfterSeconds)}.`, echo };
  }

  const outcome = await saveResponse(survey.id, token, answers);
  switch (outcome) {
    case 'saved':
      return { status: 'submitted' };
    case 'duplicate':
      return { status: 'duplicate' };
    case 'closed':
      return { status: 'error', message: 'This survey has closed, so your answers could not be saved.', echo };
    case 'bad-link':
      return { status: 'error', message: 'This link is not valid any more, so your answers could not be saved.', echo };
  }
}

export async function markSurveyOpened(token: string): Promise<void> {
  if (typeof token === 'string') await markOpened(token);
}
