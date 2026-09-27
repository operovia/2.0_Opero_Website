import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { siteUrl } from '@/server/env';

/**
 * Crawlers may read the public site. The admin and internal routes are off
 * limits. Survey pages are not blocked here on purpose: they carry noindex,
 * and a crawler has to be allowed to fetch a page to see that.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
