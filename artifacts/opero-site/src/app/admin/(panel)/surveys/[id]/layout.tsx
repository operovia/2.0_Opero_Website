import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/session';
import { getSurvey } from '@/server/surveys';

export async function generateMetadata({ params }: LayoutProps<'/admin/surveys/[id]'>): Promise<Metadata> {
  const survey = await getSurvey((await params).id);
  return { title: survey ? survey.title : 'Survey' };
}

export default async function SurveyLayout({ children, params }: LayoutProps<'/admin/surveys/[id]'>) {
  await requireAdmin();
  if (!(await getSurvey((await params).id))) notFound();
  return <div className="space-y-8">{children}</div>;
}
