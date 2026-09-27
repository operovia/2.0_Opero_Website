import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { Time } from '@/components/ui/time';
import { requireAdmin } from '@/server/auth/session';
import { getQuestions, getResponse, getSurvey, responseTitle } from '@/server/surveys';
import { formatAnswer } from '@/surveys/answers';
import { deleteResponseAction } from '../../../actions';
import { SurveyHeader } from '../../survey-header';

export default async function SurveyResponsePage({ params }: PageProps<'/admin/surveys/[id]/responses/[responseId]'>) {
  await requireAdmin();
  const { id, responseId } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const [response, questions] = await Promise.all([getResponse(id, responseId), getQuestions(id)]);
  if (!response) notFound();

  return (
    <div className="space-y-8">
      <SurveyHeader survey={survey} />
      <Link href={`/admin/surveys/${id}/responses`} className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
        <ChevronLeft className="size-4" aria-hidden />
        All responses
      </Link>

      <Card>
        <CardHeader
          title={responseTitle(response, survey.anonymous)}
          description={
            <>
              Submitted <Time value={response.submittedAt} format={survey.anonymous ? 'date' : 'datetime'} />
            </>
          }
          actions={<Badge>{response.source === 'invite' ? 'Invitation' : 'Open link'}</Badge>}
        />
        <CardBody>
          <dl className="divide-y divide-line">
            {questions.map((question, index) => {
              const answer = formatAnswer(question, response.answers[question.id]);
              return (
                <div key={question.id} className="grid grid-cols-1 gap-1 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6">
                  <dt className="text-sm font-medium text-fg-muted">
                    <span className="mr-1.5 text-fg-subtle tabular-nums">{index + 1}.</span>
                    {question.prompt}
                  </dt>
                  <dd className={answer ? 'whitespace-pre-line text-fg' : 'text-fg-subtle italic'}>{answer || 'No answer'}</dd>
                </div>
              );
            })}
          </dl>
        </CardBody>
      </Card>

      <form action={deleteResponseAction} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line px-6 py-4">
        <input type="hidden" name="surveyId" value={id} />
        <input type="hidden" name="responseId" value={response.id} />
        <p className="text-sm text-fg-muted">
          Deleting a response removes it from the results and the CSV.{response.recipientEmail ? ' The person can then use their link again.' : ''}
        </p>
        <ConfirmSubmit variant="danger" size="sm" confirm="Delete this response? This cannot be undone.">
          Delete response
        </ConfirmSubmit>
      </form>
    </div>
  );
}
