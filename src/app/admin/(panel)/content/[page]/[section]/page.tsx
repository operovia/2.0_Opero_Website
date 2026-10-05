import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionEditor } from '@/components/admin/content/section-editor';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { withSeed } from '@/content/fields';
import { getPageDef, getSectionDef } from '@/content/registry';
import { publishedSectionProblems } from '@/content/store';
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
  // Only the section's current fields, each one filled: content saved before a field was removed still carries it, and content saved
  // before a field existed (in a list item too) takes the seed's copy for it.
  const current = (stored: unknown) => {
    const merged = withSeed(def.fields, def.seed as Record<string, unknown>, stored);
    return Object.fromEntries(Object.keys(def.fields).map((key) => [key, merged[key]]));
  };
  const draft = current(row?.draft);
  const published = current(row?.published);
  // A section that withholds says here what the site is holding back, and why.
  const problems = def.withhold ? await publishedSectionProblems(page, section) : [];

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
      {problems.length ? (
        <Notice tone="danger" title={def.withhold}>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {problems.map((problem, i) => (
              <li key={i}>
                {problem.label}: {problem.message}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}
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
