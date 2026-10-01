import { isNotNull, max } from 'drizzle-orm';
import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { FOUNDER_PATH } from '@/content/constants';
import { db } from '@/db/client';
import { getPublicSettings } from '@/content/store';
import { contentSections } from '@/db/schema';
import { siteUrl } from '@/server/env';

type Entry = {
  page: string;
  path: string;
  priority: number;
  /** Other pages whose published copy this page also shows, so their publishes count as changes to it. */
  alsoFrom?: string[];
};

const pages: Entry[] = [
  { page: 'home', path: '/', priority: 1 },
  { page: 'partners', path: '/partners', priority: 0.8 },
  // The Founder page shows the Investor Hub's introduction and story sections.
  { page: 'founder', path: FOUNDER_PATH, priority: 0.6, alsoFrom: ['investors'] },
  { page: 'privacy', path: '/privacy', priority: 0.3 },
];

/**
 * The public pages at the site's own address. Surveys, the admin, the front
 * door, and the Investor Hub (investors and admins only) are left out on
 * purpose, and a private site lists nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The address and the dates come from the running site, never from build time.
  await connection();
  const { settings } = await getPublicSettings();
  if (settings.privateSite) return [];
  const base = siteUrl();
  const rows = await db
    .select({ page: contentSections.page, updated: max(contentSections.publishedAt) })
    .from(contentSections)
    .where(isNotNull(contentSections.publishedAt))
    .groupBy(contentSections.page);
  const updated = new Map(rows.map((row) => [row.page, row.updated]));
  // Header and footer changes touch every page.
  const site = updated.get('site');

  return pages.map(({ page, path, priority, alsoFrom = [] }) => {
    const dates = [page, ...alsoFrom].map((key) => updated.get(key));
    const lastModified = [...dates, site].filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0];
    return { url: `${base}${path}`, ...(lastModified ? { lastModified } : {}), changeFrequency: 'monthly', priority };
  });
}
