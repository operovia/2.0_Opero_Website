import { ChevronRight, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { getPageDef } from '@/content/registry';
import { requireAdmin } from '@/server/auth/session';
import { pageStatus } from '@/server/content-admin';

export async function generateMetadata({ params }: PageProps<'/admin/content/[page]'>): Promise<Metadata> {
  const { page } = await params;
  return { title: getPageDef(page)?.label ?? 'Content' };
}

export default async function ContentPageSections({ params }: PageProps<'/admin/content/[page]'>) {
  await requireAdmin();
  const { page } = await params;
  const status = await pageStatus(page);
  if (!status) notFound();

  const drafts = status.sections.filter((s) => s.hasDraft).length;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/admin/content" className="hover:text-fg">
          Content
        </Link>
      </nav>
      <PageHeader
        title={status.def.label}
        description={status.def.description}
        actions={
          drafts ? (
            <a
              href={`/api/preview?path=${encodeURIComponent(status.def.path ?? '/')}`}
              target="_blank"
              rel="noopener"
              className={buttonClasses({ variant: 'secondary' })}
            >
              <ExternalLink className="size-4" aria-hidden />
              Preview drafts
            </a>
          ) : null
        }
      />
      <Card>
        <ul className="divide-y divide-line">
          {status.sections.map((section) => (
            <li key={section.key}>
              <Link
                href={`/admin/content/${page}/${section.key}`}
                className="group flex items-center justify-between gap-4 px-6 py-5 hover:bg-accent-soft"
              >
                <div className="min-w-0 space-y-1.5">
                  <p className="font-semibold text-fg">{section.label}</p>
                  <p className="text-sm text-fg-muted">
                    {section.publishedAt ? (
                      <>
                        Version {section.version}, published <Time value={section.publishedAt} format="relative" />
                        {section.publishedBy ? ` by ${section.publishedBy}` : ''}
                      </>
                    ) : (
                      'Not published yet'
                    )}
                  </p>
                  {section.hasDraft || section.needsReview ? (
                    <div className="flex flex-wrap gap-2">
                      {section.hasDraft ? <Badge tone="warning">Unpublished changes</Badge> : null}
                      {section.needsReview ? <Badge>Drafted copy to review</Badge> : null}
                    </div>
                  ) : null}
                </div>
                <ChevronRight className="size-5 shrink-0 text-fg-subtle group-hover:text-fg" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
