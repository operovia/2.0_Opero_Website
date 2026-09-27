import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SurveyStatusBadge } from '@/components/admin/surveys/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { requireAdmin } from '@/server/auth/session';
import { listSurveys } from '@/server/surveys';

export const metadata: Metadata = { title: 'Surveys' };

const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

export default async function SurveysPage() {
  await requireAdmin();
  const surveys = await listSurveys();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Surveys"
        description="Write a survey, send it to a list of people, and read the results. Surveys are never linked from the public site or shown in search results."
        actions={
          <ButtonLink href="/admin/surveys/new">
            <Plus className="size-4" aria-hidden />
            New survey
          </ButtonLink>
        }
      />

      {surveys.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {surveys.map((survey) => (
              <li key={survey.id} className="first:*:rounded-t-xl last:*:rounded-b-xl">
                <Link
                  href={`/admin/surveys/${survey.id}`}
                  className="grid grid-cols-1 gap-1 px-6 py-4 hover:bg-accent-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-fg">{survey.title}</span>
                      <SurveyStatusBadge status={survey.status} />
                    </p>
                    <p className="mt-1 truncate text-sm text-fg-muted">
                      {[count(survey.questions, 'question'), count(survey.responses, 'response'), count(survey.recipients, 'recipient'), survey.anonymous ? 'Anonymous' : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <p className="text-sm text-fg-subtle sm:text-right">
                    {survey.lastResponseAt ? (
                      <>
                        Last response <Time value={survey.lastResponseAt} format="relative" />
                      </>
                    ) : (
                      <>
                        Created <Time value={survey.createdAt} format="date" />
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState title="No surveys yet">Create a survey, add its questions, then send it to people or share an open link.</EmptyState>
      )}
    </div>
  );
}
