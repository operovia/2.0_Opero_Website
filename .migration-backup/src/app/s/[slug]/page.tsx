import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { RichText } from '@/components/rich-text';
import { isRichEmpty } from '@/lib/rich-text';
import { getSession } from '@/server/auth/session';
import { publicView } from '@/server/survey-responses';
import { getSurveyBySlug } from '@/server/surveys';
import { SurveyForm } from './survey-form';

type Props = PageProps<'/s/[slug]'>;

async function readQuery(props: Props) {
  const [{ slug }, query] = await Promise.all([props.params, props.searchParams]);
  const token = typeof query.t === 'string' ? query.t : null;
  const preview = query.preview === '1' && Boolean(await getSession());
  return { slug, token, preview };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, preview } = await readQuery(props);
  const survey = await getSurveyBySlug(slug);
  return { title: survey && (survey.status !== 'draft' || preview) ? survey.title : 'Survey' };
}

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="space-y-4 py-8">
      <h1 className="text-display-sm font-medium text-metal">{title}</h1>
      {children ? <div className="text-lg text-fg-muted">{children}</div> : null}
    </div>
  );
}

export default async function SurveyPage(props: Props) {
  const { slug, token, preview } = await readQuery(props);
  const view = await publicView(slug, token, preview);
  if (!view) notFound();
  const { survey } = view;

  switch (view.kind) {
    case 'closed':
      return (
        <Message title={survey.title}>
          <p>This survey has closed and is no longer taking responses. Thank you for your interest.</p>
        </Message>
      );
    case 'invite-only':
      return (
        <Message title="This survey is by invitation">
          <p>Please use the personal link from your invitation email.</p>
        </Message>
      );
    case 'bad-link':
      return (
        <Message title="This link does not work">
          <p>Check that you used the whole link from your invitation email. If it still does not work, reply to that email and we will send a new one.</p>
        </Message>
      );
    case 'done':
      return (
        <Message title="You have already responded">
          <RichText doc={survey.thankYou} />
        </Message>
      );
  }

  return (
    <div className="space-y-10">
      {view.preview ? (
        <p role="status" className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-fg">
          <span className="font-semibold">Preview.</span> This is how the survey looks to respondents. Answers are checked but not saved.
          {survey.status === 'draft' ? ' The survey is still a draft, so nobody else can see it yet.' : ''}
        </p>
      ) : null}
      <SurveyForm
        surveyId={survey.id}
        token={view.token}
        preview={view.preview}
        title={survey.title}
        intro={isRichEmpty(survey.intro) ? null : <RichText doc={survey.intro} className="text-lg text-fg-muted" />}
        thankYou={<RichText doc={survey.thankYou} className="text-lg text-fg-muted" />}
        questions={view.questions}
      />
    </div>
  );
}
