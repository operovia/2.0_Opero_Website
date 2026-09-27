import { isNotNull, max } from 'drizzle-orm';
import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { db } from '@/db/client';
import { contentSections } from '@/db/schema';
import { siteUrl } from '@/server/env';

const pages = [
  { page: 'home', path: '/', priority: 1 },
  { page: 'partners', path: '/partners', priority: 0.8 },
  { page: 'privacy', path: '/privacy', priority: 0.3 },
] as const;

/** The public pages at the site's own address. Surveys and the admin are left out on purpose. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The address and the dates come from the running site, never from build time.
  await connection();
  const base = siteUrl();
  const rows = await db
    .select({ page: contentSections.page, updated: max(contentSections.publishedAt) })
    .from(contentSections)
    .where(isNotNull(contentSections.publishedAt))
    .groupBy(contentSections.page);
  const updated = new Map(rows.map((row) => [row.page, row.updated]));
  // Header and footer changes touch every page.
  const site = updated.get('site');

  return pages.map(({ page, path, priority }) => {
    const own = updated.get(page);
    const lastModified = [own, site].filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0];
    return { url: `${base}${path}`, ...(lastModified ? { lastModified } : {}), changeFrequency: 'monthly', priority };
  });
}
