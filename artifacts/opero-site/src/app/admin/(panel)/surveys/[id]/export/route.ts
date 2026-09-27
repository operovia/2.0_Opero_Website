import { audit } from '@/server/audit';
import { getSession } from '@/server/auth/session';
import { clientIp } from '@/server/request';
import { allResponses, getQuestions, getSurvey } from '@/server/surveys';
import { formatAnswer } from '@/surveys/answers';
import { toCsv } from '@/surveys/csv';

/**
 * Every response to a survey as a CSV file, one row per response and one
 * column per question. Anonymous surveys leave out names and times of day.
 */
export async function GET(_request: Request, { params }: RouteContext<'/admin/surveys/[id]/export'>) {
  const session = await getSession();
  if (!session) return new Response('Sign in to download responses.', { status: 401 });
  const survey = await getSurvey((await params).id);
  if (!survey) return new Response('Not found', { status: 404 });
  const [questions, rows] = await Promise.all([getQuestions(survey.id), allResponses(survey.id)]);

  const header = [
    'Response ID',
    survey.anonymous ? 'Submitted (date)' : 'Submitted (UTC)',
    'Source',
    ...(survey.anonymous ? [] : ['Name', 'Email']),
    ...questions.map((q, i) => `${i + 1}. ${q.prompt}`),
  ];
  const body = rows.map((row) => [
    row.id,
    survey.anonymous ? row.submittedAt.toISOString().slice(0, 10) : row.submittedAt.toISOString().replace('T', ' ').slice(0, 19),
    row.source === 'invite' ? 'Invitation' : 'Open link',
    ...(survey.anonymous ? [] : [row.recipientName ?? '', row.recipientEmail ?? '']),
    ...questions.map((q) => formatAnswer(q, row.answers[q.id])),
  ]);

  await audit({ id: session.user.id, email: session.user.email }, 'survey.export', {
    target: survey.title,
    details: { note: `${rows.length} ${rows.length === 1 ? 'response' : 'responses'}` },
    ip: await clientIp(),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv([header, ...body]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${survey.slug}-responses-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
