import type { Metadata } from 'next';
import { getPublicSettings } from '@/content/store';

type PageOpenGraph = { title?: string; description?: string; url?: string };

/**
 * Open Graph details for a public page. Next.js replaces the layout's
 * openGraph object wholesale when a page sets its own, so every page builds
 * on this to keep the site name and the social share image.
 */
export async function openGraph(page: PageOpenGraph = {}): Promise<NonNullable<Metadata['openGraph']>> {
  const { settings, socialImage } = await getPublicSettings();
  return {
    type: 'website',
    siteName: settings.siteName,
    ...(socialImage ? { images: [{ url: socialImage.url, width: socialImage.width ?? undefined, height: socialImage.height ?? undefined }] } : {}),
    ...page,
  };
}
