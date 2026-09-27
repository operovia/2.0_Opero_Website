import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { SurveyStatusBadge } from '@/components/admin/surveys/status-badge';
import { surveyCounts, surveyLink, type Survey } from '@/server/surveys';
import { SurveyControls } from './survey-controls';
import { SurveyTabs } from './survey-tabs';

const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * The top of every survey page: title, status, counts, controls, and tabs.
 * Each page renders it (rather than the shared layout) so the counts are
 * fresh whenever you switch tabs.
 */
export async function SurveyHeader({ survey }: { survey: Survey }) {
  const counts = await surveyCounts(survey.id);
  return (
    <div className="space-y-5">
      <Link href="/admin/surveys" className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
        <ChevronLeft className="size-4" aria-hidden />
        All surveys
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-fg">
            <span className="min-w-0 break-words">{survey.title}</span>
            <SurveyStatusBadge status={survey.status} />
          </h1>
          <p className="text-sm text-fg-muted">
            {[
              count(counts.questions, 'question'),
              count(counts.responses, 'response'),
              counts.recipients ? `${counts.completed} of ${count(counts.recipients, 'recipient')} finished` : '',
              survey.anonymous ? 'Anonymous' : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <SurveyControls
          surveyId={survey.id}
          status={survey.status}
          previewHref={`/s/${survey.slug}?preview=1`}
          openLink={survey.openLinkEnabled ? surveyLink(survey) : null}
          hasQuestions={counts.questions > 0}
        />
      </div>
      <SurveyTabs id={survey.id} />
    </div>
  );
}
