import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionEditor } from '@/components/admin/content/section-editor';
import { PageHeader } from '@/components/ui/page-header';
import { getPageDef, getSectionDef } from '@/content/registry';
import { requireAdmin } from '@/server/auth/session';
import { sectionForEdit } from '@/server/content-admin';

export async function generateMetadata({ params }: PageProps<'/admin/content/[page]/[section]'>): Promise<Metadata> {
  const { page, section } = await params;
  return { title: `${getSectionDef(page, section)?.label ?? 'Section'}, ${getPageDef(page)?.label ?? ''}` };
}

export default async function EditSectionPage({ params }: PageProps<'/admin/content/[page]/[section]'>) {
  await requireAdmin();
  const { page, section } = await params;
  const pageDef = getPageDef(page);
  const data = await sectionForEdit(page, section);
  if (!pageDef || !data) notFound();

  const { def, row, versions } = data;
  const draft = { ...def.seed, ...(row?.draft ?? {}) };
  const published = { ...def.seed, ...(row?.published ?? {}) };

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-fg-muted">
        <Link href="/admin/content" className="hover:text-fg">
          Content
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/admin/content/${page}`} className="hover:text-fg">
          {pageDef.label}
        </Link>
      </nav>
      <PageHeader title={def.label} description={def.description} />
      <SectionEditor
        page={page}
        section={section}
        fields={def.fields}
        draft={draft}
        published={published}
        version={row?.version ?? 0}
        needsReview={row?.needsReview ?? Boolean(def.draftCopy)}
        previewPath={pageDef.path ?? '/'}
        versions={versions.map((v) => ({ ...v, publishedAt: v.publishedAt.toISOString() }))}
      />
    </div>
  );
}
