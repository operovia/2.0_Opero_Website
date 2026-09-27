import { ChevronLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { requireAdmin } from '@/server/auth/session';
import { getQuestions, getSurvey, listResponses, responseTitle, RESPONSES_PAGE_SIZE } from '@/server/surveys';
import { formatAnswer } from '@/surveys/answers';
import { SurveyHeader } from '../survey-header';

export default async function SurveyResponsesPage({ params, searchParams }: PageProps<'/admin/surveys/[id]/responses'>) {
  await requireAdmin();
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ rows, total }, questions] = await Promise.all([listResponses(id, page), getQuestions(id)]);
  const pages = Math.max(1, Math.ceil(total / RESPONSES_PAGE_SIZE));
  // A glimpse of each response: its first written answer, if any.
  const firstText = questions.find((q) => q.type === 'long_text' || q.type === 'short_text');

  return (
    <div className="space-y-8">
      <SurveyHeader survey={survey} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/admin/surveys/${id}/results`} className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden />
          Results
        </Link>
        {total ? (
          <a href={`/admin/surveys/${id}/export`} className={buttonClasses({ variant: 'secondary' })}>
            <Download className="size-4" aria-hidden />
            Download CSV
          </a>
        ) : null}
      </div>

      {rows.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const glimpse = firstText ? formatAnswer(firstText, row.answers[firstText.id]) : '';
              return (
                <li key={row.id} className="first:*:rounded-t-xl last:*:rounded-b-xl">
                  <Link
                    href={`/admin/surveys/${id}/responses/${row.id}`}
                    className="grid grid-cols-1 gap-1 px-6 py-4 hover:bg-accent-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-fg">{responseTitle(row, survey.anonymous)}</span>
                        <Badge>{row.source === 'invite' ? 'Invitation' : 'Open link'}</Badge>
                      </p>
                      {glimpse ? <p className="mt-1 truncate text-sm text-fg-muted">{glimpse}</p> : null}
                    </div>
                    <p className="text-sm text-fg-subtle sm:text-right">
                      <Time value={row.submittedAt} format={survey.anonymous ? 'date' : 'datetime'} />
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState title="No responses yet">Responses appear here as people submit the survey.</EmptyState>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/admin/surveys/${id}/responses?page=${page - 1}`} className="font-medium text-fg underline underline-offset-4">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-fg-subtle">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/surveys/${id}/responses?page=${page + 1}`} className="font-medium text-fg underline underline-offset-4">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
