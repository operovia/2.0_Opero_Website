import { isNotNull, max } from 'drizzle-orm';
import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { INVESTOR_HUB_PATH } from '@/content/constants';
import { db } from '@/db/client';
import { contentSections } from '@/db/schema';
import { siteUrl } from '@/server/env';
import { getSettings } from '@/server/settings';

const pages = [
  { page: 'home', path: '/', priority: 1 },
  { page: 'partners', path: '/partners', priority: 0.8 },
  { page: 'investors', path: INVESTOR_HUB_PATH, priority: 0.6 },
  { page: 'privacy', path: '/privacy', priority: 0.3 },
] as const;

/** The public pages at the site's own address. Surveys and the admin are left out on purpose, and the Investor Hub while it is switched off. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The address and the dates come from the running site, never from build time.
  await connection();
  const base = siteUrl();
  const settings = await getSettings();
  const rows = await db
    .select({ page: contentSections.page, updated: max(contentSections.publishedAt) })
    .from(contentSections)
    .where(isNotNull(contentSections.publishedAt))
    .groupBy(contentSections.page);
  const updated = new Map(rows.map((row) => [row.page, row.updated]));
  // Header and footer changes touch every page.
  const site = updated.get('site');

  return pages
    .filter(({ page }) => page !== 'investors' || settings.investorHubEnabled)
    .map(({ page, path, priority }) => {
      const own = updated.get(page);
      const lastModified = [own, site].filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0];
      return { url: `${base}${path}`, ...(lastModified ? { lastModified } : {}), changeFrequency: 'monthly', priority };
    });
}
