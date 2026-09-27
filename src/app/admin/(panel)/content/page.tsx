import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { requireAdmin } from '@/server/auth/session';
import { allPagesStatus } from '@/server/content-admin';

export const metadata: Metadata = { title: 'Content' };

export default async function ContentPage() {
  await requireAdmin();
  const pages = await allPagesStatus();
  return (
    <div className="space-y-8">
      <PageHeader
        title="Content"
        description="Every word on the public site. Edit a section, save a draft, preview it on the page, then publish."
      />
      <Card>
        <ul className="divide-y divide-line">
          {pages.map((page) => (
            <li key={page.key}>
              <Link href={`/admin/content/${page.key}`} className="group flex items-center justify-between gap-4 px-6 py-5 hover:bg-accent-soft">
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{page.label}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    {page.description} {page.sections} {page.sections === 1 ? 'section' : 'sections'}.
                  </p>
                  {page.drafts || page.needsReview ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {page.drafts ? <Badge tone="warning">{page.drafts} unpublished</Badge> : null}
                      {page.needsReview ? <Badge>{page.needsReview} to review</Badge> : null}
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
