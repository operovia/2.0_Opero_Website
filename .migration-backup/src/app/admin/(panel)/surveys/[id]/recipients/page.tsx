import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { requireAdmin } from '@/server/auth/session';
import { emailConfig } from '@/server/env';
import { getSurvey, listRecipients, surveyLink } from '@/server/surveys';
import { AddRecipientsForm } from './add-recipients-form';
import { EmailTemplatesForm } from './email-templates-form';
import { RecipientList, type RecipientItem } from './recipient-list';
import { SendPanel } from './send-panel';
import { SurveyHeader } from '../survey-header';

export default async function SurveyRecipientsPage({ params }: PageProps<'/admin/surveys/[id]/recipients'>) {
  await requireAdmin();
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const recipients = await listRecipients(id);

  const items: RecipientItem[] = recipients.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    link: surveyLink(survey, r.token),
    invitedAt: r.invitedAt?.toISOString() ?? null,
    lastSentAt: r.lastSentAt?.toISOString() ?? null,
    remindedAt: r.remindedAt?.toISOString() ?? null,
    openedAt: r.openedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    sendCount: r.sendCount,
  }));
  const notInvited = recipients.filter((r) => !r.invitedAt && !r.completedAt).length;
  const waiting = recipients.filter((r) => r.invitedAt && !r.completedAt).length;

  return (
    <div className="space-y-8">
      <SurveyHeader survey={survey} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Add people" description="Type or paste names and email addresses, one person per line." />
          <CardBody>
            <AddRecipientsForm surveyId={survey.id} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Send" description="Everyone gets their own link, which works once." />
          <CardBody>
            <SendPanel surveyId={survey.id} open={survey.status === 'open'} notInvited={notInvited} waiting={waiting} emailReady={Boolean(emailConfig().apiKey)} />
          </CardBody>
        </Card>
      </div>

      <EmailTemplatesForm
        surveyId={survey.id}
        surveyTitle={survey.title}
        sampleName={recipients.find((r) => r.name)?.name ?? 'Jordan'}
        values={{
          inviteSubject: survey.inviteSubject,
          inviteMessage: survey.inviteMessage,
          reminderSubject: survey.reminderSubject,
          reminderMessage: survey.reminderMessage,
        }}
      />

      <RecipientList surveyId={survey.id} open={survey.status === 'open'} items={items} />
    </div>
  );
}
