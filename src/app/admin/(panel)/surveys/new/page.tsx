import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { requireAdmin } from '@/server/auth/session';
import { siteUrl } from '@/server/env';
import { NewSurveyForm } from './new-survey-form';

export const metadata: Metadata = { title: 'New survey' };

export default async function NewSurveyPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <Link href="/admin/surveys" className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden />
          All surveys
        </Link>
        <PageHeader title="New survey" description="Start with a title. You add the questions next, and nothing is sent until you choose to." />
      </div>
      <NewSurveyForm base={`${siteUrl()}/s/`} />
    </div>
  );
}
