import 'server-only';
import { and, desc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { adminUsers, contentSections, contentVersions } from '@/db/schema';
import { schemaFor } from '@/content/fields';
import { getPageDef, getSectionDef, pages, type PageDef, type SectionDef } from '@/content/registry';
import { changeContent } from '@/server/content-version';

/** How many published versions of each section are kept for rollback. */
export const VERSIONS_KEPT = 20;

export type SectionRow = typeof contentSections.$inferSelect;

/** Stable JSON for comparing drafts with published content. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sameContent(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}

export type SectionStatus = {
  key: string;
  label: string;
  description?: string;
  version: number;
  hasDraft: boolean;
  needsReview: boolean;
  publishedAt: Date | null;
  publishedBy: string | null;
  draftUpdatedAt: Date | null;
};

async function rowsFor(page: string): Promise<(SectionRow & { publisherEmail: string | null })[]> {
  const rows = await db
    .select({ section: contentSections, publisherEmail: adminUsers.email })
    .from(contentSections)
    .leftJoin(adminUsers, eq(contentSections.publishedBy, adminUsers.id))
    .where(eq(contentSections.page, page));
  return rows.map((r) => ({ ...r.section, publisherEmail: r.publisherEmail }));
}

/** Status of every section on a page, in the order the page shows them. */
export async function pageStatus(page: string): Promise<{ def: PageDef; sections: SectionStatus[] } | null> {
  const def = getPageDef(page);
  if (!def) return null;
  const rows = new Map((await rowsFor(page)).map((row) => [row.section, row]));
  const sections = Object.entries(def.sections).map(([key, section]): SectionStatus => {
    const row = rows.get(key);
    return {
      key,
      label: section.label,
      description: section.description,
      version: row?.version ?? 0,
      hasDraft: row ? !sameContent(row.draft, row.published) : false,
      needsReview: row?.needsReview ?? Boolean(section.draftCopy),
      publishedAt: row?.publishedAt ?? null,
      publishedBy: row?.publisherEmail ?? null,
      draftUpdatedAt: row?.draftUpdatedAt ?? null,
    };
  });
  return { def, sections };
}

/** Summary counts for every page, for the content overview. */
export async function allPagesStatus() {
  return Promise.all(
    Object.keys(pages).map(async (page) => {
      const status = (await pageStatus(page))!;
      return {
        key: page,
        label: status.def.label,
        description: status.def.description,
        path: status.def.path,
        sections: status.sections.length,
        drafts: status.sections.filter((s) => s.hasDraft).length,
        needsReview: status.sections.filter((s) => s.needsReview).length,
      };
    }),
  );
}

export type VersionEntry = { id: string; version: number; note: string; publishedAt: Date; publishedBy: string | null };

export async function sectionForEdit(page: string, section: string) {
  const def = getSectionDef(page, section);
  if (!def) return null;
  const [row] = await db
    .select()
    .from(contentSections)
    .where(and(eq(contentSections.page, page), eq(contentSections.section, section)))
    .limit(1);
  const versions: VersionEntry[] = row
    ? await db
        .select({
          id: contentVersions.id,
          version: contentVersions.version,
          note: contentVersions.note,
          publishedAt: contentVersions.publishedAt,
          publishedBy: adminUsers.email,
        })
        .from(contentVersions)
        .leftJoin(adminUsers, eq(contentVersions.publishedBy, adminUsers.id))
        .where(eq(contentVersions.sectionId, row.id))
        .orderBy(desc(contentVersions.version))
        .limit(VERSIONS_KEPT)
    : [];
  return { def, row: row ?? null, versions };
}

/* ------------------------------------------------------------------------ */
/* Changes                                                                  */
/* ------------------------------------------------------------------------ */

export type ValidationResult = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

/**
 * Where to show a validation problem: on the field itself, or on one field
 * of one list item ("stats.2.label"). Problems deep inside rich text are
 * reported on the rich text field.
 */
function errorKey(def: SectionDef, path: readonly PropertyKey[]): string {
  const [field, index, itemField] = path;
  const fieldDef = def.fields[String(field)];
  if (fieldDef?.kind === 'list' && typeof index === 'number') {
    return itemField !== undefined ? `${String(field)}.${index}.${String(itemField)}` : `${String(field)}.${index}`;
  }
  return String(field ?? '');
}

export function validateSection(def: SectionDef, data: unknown): ValidationResult {
  const parsed = schemaFor(def.fields).safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data as Record<string, unknown> };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = errorKey(def, issue.path);
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

async function ensureRow(page: string, section: string, def: SectionDef): Promise<SectionRow> {
  const [existing] = await db
    .select()
    .from(contentSections)
    .where(and(eq(contentSections.page, page), eq(contentSections.section, section)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(contentSections)
    .values({ page, section, draft: def.seed, published: def.seed, version: 0, needsReview: Boolean(def.draftCopy) })
    .onConflictDoNothing()
    .returning();
  return created ?? (await ensureRow(page, section, def));
}

export async function saveDraft(page: string, section: string, data: Record<string, unknown>, userId: string): Promise<void> {
  const def = getSectionDef(page, section)!;
  const row = await ensureRow(page, section, def);
  await db
    .update(contentSections)
    .set({ draft: data, draftUpdatedAt: new Date(), draftUpdatedBy: userId })
    .where(eq(contentSections.id, row.id));
}

/**
 * Publishes data as the section's next version and makes it the draft too.
 * Keeps the newest twenty versions.
 */
export async function publish(page: string, section: string, data: Record<string, unknown>, userId: string, note = ''): Promise<number> {
  const def = getSectionDef(page, section)!;
  const row = await ensureRow(page, section, def);
  return changeContent(async (tx) => {
    const [locked] = await tx.select({ version: contentSections.version }).from(contentSections).where(eq(contentSections.id, row.id)).for('update');
    const version = (locked?.version ?? 0) + 1;
    const now = new Date();
    await tx
      .update(contentSections)
      .set({
        draft: data,
        published: data,
        version,
        needsReview: false,
        draftUpdatedAt: now,
        draftUpdatedBy: userId,
        publishedAt: now,
        publishedBy: userId,
      })
      .where(eq(contentSections.id, row.id));
    await tx.insert(contentVersions).values({ sectionId: row.id, version, data, note, publishedBy: userId, publishedAt: now });
    await tx
      .delete(contentVersions)
      .where(and(eq(contentVersions.sectionId, row.id), lt(contentVersions.version, version - VERSIONS_KEPT + 1)));
    return version;
  });
}

export async function discardDraft(page: string, section: string): Promise<Record<string, unknown> | null> {
  const [row] = await db
    .update(contentSections)
    .set({ draft: sql`${contentSections.published}`, draftUpdatedAt: new Date() })
    .where(and(eq(contentSections.page, page), eq(contentSections.section, section)))
    .returning({ published: contentSections.published });
  return row?.published ?? null;
}

export async function versionData(page: string, section: string, versionId: string) {
  const [row] = await db
    .select({ data: contentVersions.data, version: contentVersions.version })
    .from(contentVersions)
    .innerJoin(contentSections, eq(contentVersions.sectionId, contentSections.id))
    .where(and(eq(contentVersions.id, versionId), eq(contentSections.page, page), eq(contentSections.section, section)))
    .limit(1);
  return row ?? null;
}

/** The last few content publishes, newest first, for the dashboard. */
export async function recentPublishes(limit = 5) {
  return db
    .select({
      page: contentSections.page,
      section: contentSections.section,
      version: contentVersions.version,
      note: contentVersions.note,
      publishedAt: contentVersions.publishedAt,
      publisherName: adminUsers.name,
      publisherEmail: adminUsers.email,
    })
    .from(contentVersions)
    .innerJoin(contentSections, eq(contentVersions.sectionId, contentSections.id))
    .leftJoin(adminUsers, eq(contentVersions.publishedBy, adminUsers.id))
    // Publishes made by people; the initial content seeded at first run has no publisher.
    .where(and(inArray(contentSections.page, Object.keys(pages)), isNotNull(contentVersions.publishedBy)))
    .orderBy(desc(contentVersions.publishedAt))
    .limit(limit);
}
