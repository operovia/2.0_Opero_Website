import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { requireAdmin } from '@/server/auth/session';
import { siteUrl } from '@/server/env';
import { getSurvey, invitationsSent, responseCount } from '@/server/surveys';
import { deleteSurveyAction } from '../../actions';
import { DeleteResponses } from './delete-responses';
import { SurveySettingsForm } from './survey-settings-form';
import { SurveyHeader } from '../survey-header';

export default async function SurveySettingsPage({ params }: PageProps<'/admin/surveys/[id]/settings'>) {
  await requireAdmin();
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const [responses, sent] = await Promise.all([responseCount(id), invitationsSent(id)]);

  return (
    <div className="space-y-8">
      <SurveyHeader survey={survey} />
      <SurveySettingsForm
        surveyId={survey.id}
        base={`${siteUrl()}/s/`}
        values={{
          title: survey.title,
          slug: survey.slug,
          intro: survey.intro,
          thankYou: survey.thankYou,
          anonymous: survey.anonymous,
          openLinkEnabled: survey.openLinkEnabled,
        }}
        slugLocked={sent || responses > 0}
        anonymityLocked={responses > 0}
      />

      <Card>
        <CardHeader title="Delete" description="These cannot be undone." />
        <CardBody className="space-y-6">
          <DeleteResponses surveyId={survey.id} responses={responses} />
          <form action={deleteSurveyAction} className="flex flex-wrap items-center justify-between gap-4">
            <input type="hidden" name="surveyId" value={survey.id} />
            <div className="max-w-prose">
              <p className="font-medium text-fg">Delete this survey</p>
              <p className="text-sm text-fg-muted">Removes the survey, its questions, its recipient list, and every response. Links already sent stop working.</p>
            </div>
            <ConfirmSubmit variant="danger" confirm={`Delete "${survey.title}" with all its questions, recipients, and responses? This cannot be undone.`}>
              Delete survey
            </ConfirmSubmit>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
