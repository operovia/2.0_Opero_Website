import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/session';
import { getQuestions, getSurvey, responseCount } from '@/server/surveys';
import { QuestionBuilder } from './question-builder';
import { SurveyHeader } from './survey-header';

export default async function SurveyQuestionsPage({ params }: PageProps<'/admin/surveys/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const [questions, responses] = await Promise.all([getQuestions(id), responseCount(id)]);
  return (
    <>
      <SurveyHeader survey={survey} />
      <QuestionBuilder surveyId={id} initial={questions} responses={responses} previewHref={`/s/${survey.slug}?preview=1`} />
    </>
  );
}
