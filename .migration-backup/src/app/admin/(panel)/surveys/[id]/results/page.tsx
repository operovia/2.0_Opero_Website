import { Download, List } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Bars } from '@/components/admin/surveys/bars';
import { buttonClasses } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { requireAdmin } from '@/server/auth/session';
import { allResponses, forStats, getQuestions, getSurvey, surveyCounts } from '@/server/surveys';
import { summarize, type QuestionSummary } from '@/surveys/stats';
import { questionTypeLabels } from '@/surveys/types';
import { TextAnswers } from './text-answers';
import { SurveyHeader } from '../survey-header';

const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

export default async function SurveyResultsPage({ params }: PageProps<'/admin/surveys/[id]/results'>) {
  await requireAdmin();
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const [questions, rows, counts] = await Promise.all([getQuestions(id), allResponses(id), surveyCounts(id)]);
  const responses = forStats(rows);
  const fromInvites = rows.filter((r) => r.source === 'invite').length;

  return (
    <div className="space-y-8">
      <SurveyHeader survey={survey} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <dl className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
          <Stat label="Responses" value={rows.length.toLocaleString('en-US')} />
          <Stat label="From invitations" value={fromInvites.toLocaleString('en-US')} />
          <Stat label="From the open link" value={(rows.length - fromInvites).toLocaleString('en-US')} />
          <Stat
            label="Invitations finished"
            value={counts.invited ? `${Math.round((counts.completed / counts.invited) * 100)}%` : 'None sent'}
            note={counts.invited ? `${counts.completed} of ${counts.invited}` : undefined}
          />
        </dl>
        {rows.length ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/surveys/${id}/responses`} className={buttonClasses({ variant: 'secondary' })}>
              <List className="size-4" aria-hidden />
              Individual responses
            </Link>
            {/* A download, so a plain link rather than client navigation. */}
            <a href={`/admin/surveys/${id}/export`} className={buttonClasses({ variant: 'secondary' })}>
              <Download className="size-4" aria-hidden />
              Download CSV
            </a>
          </div>
        ) : null}
      </div>

      {rows.length ? (
        <>
          <p className="text-sm text-fg-muted">
            Last response <Time value={rows[0]!.submittedAt} format={survey.anonymous ? 'date' : 'relative'} />.
            {survey.anonymous ? ' This survey is anonymous, so answers are not linked to people.' : ''} Percentages are of the people who answered each question.
          </p>
          <ol className="space-y-6">
            {questions.map((question, index) => {
              const summary = summarize(question, responses);
              return (
                <li key={question.id}>
                  <Card>
                    <CardHeader
                      title={
                        <>
                          <span className="mr-1.5 text-fg-subtle tabular-nums">{index + 1}.</span>
                          {question.prompt}
                        </>
                      }
                      description={`${questionTypeLabels[question.type]} · ${count(summary.answered, 'answer')}${summary.skipped ? ` · ${summary.skipped} skipped` : ''}`}
                    />
                    <CardBody>
                      <Summary summary={summary} surveyId={id} />
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <EmptyState title="No responses yet">
          {survey.status === 'open'
            ? 'Results appear here as people respond.'
            : survey.status === 'draft'
              ? 'Open the survey and send it out; results appear here as people respond.'
              : 'This survey closed without any responses.'}
        </EmptyState>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div>
      <dt className="text-eyebrow font-semibold text-fg-subtle uppercase">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-fg tabular-nums">
        {value}
        {note ? <span className="ml-2 text-sm font-normal text-fg-muted">{note}</span> : null}
      </dd>
    </div>
  );
}

function Summary({ summary, surveyId }: { summary: QuestionSummary; surveyId: string }) {
  if (!summary.answered) return <p className="text-sm text-fg-muted">Nobody has answered this question yet.</p>;
  switch (summary.kind) {
    case 'choice':
      return (
        <div className="space-y-3">
          {summary.multiple ? <p className="text-sm text-fg-muted">People could choose more than one, so shares can add up to more than 100%.</p> : null}
          <Bars bars={summary.bars} />
        </div>
      );
    case 'rating':
      return (
        <div className="space-y-5">
          <p className="text-3xl font-semibold text-fg tabular-nums">
            {summary.average!.toFixed(1)}
            <span className="ml-2 text-base font-normal text-fg-muted">average out of 5</span>
          </p>
          <Bars bars={[...summary.bars].reverse()} />
        </div>
      );
    case 'nps': {
      const share = (n: number) => `${Math.round((n / summary.answered) * 100)}%`;
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <p className="text-3xl font-semibold text-fg tabular-nums">
              {summary.score! > 0 ? `+${summary.score}` : summary.score}
              <span className="ml-2 text-base font-normal text-fg-muted">Net Promoter Score</span>
            </p>
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-fg-subtle">Promoters (9 to 10)</dt>
                <dd className="font-semibold text-success tabular-nums">
                  {summary.promoters} · {share(summary.promoters)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Passives (7 to 8)</dt>
                <dd className="font-semibold text-warning tabular-nums">
                  {summary.passives} · {share(summary.passives)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Detractors (0 to 6)</dt>
                <dd className="font-semibold text-danger tabular-nums">
                  {summary.detractors} · {share(summary.detractors)}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-sm text-fg-muted">The score is the share of promoters minus the share of detractors, from -100 to +100.</p>
          <Bars bars={[...summary.bars].reverse()} tone={(bar) => (Number(bar.key) >= 9 ? 'success' : Number(bar.key) >= 7 ? 'warning' : 'danger')} />
        </div>
      );
    }
    case 'text':
      return (
        <TextAnswers
          surveyId={surveyId}
          answers={summary.answers.map((a) => ({ responseId: a.responseId, text: a.text, submittedAt: a.submittedAt.toISOString(), respondent: a.respondent }))}
        />
      );
  }
}
