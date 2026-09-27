import { getPublicSettings } from '@/content/store';
type OpenGraph = { type: 'website'; siteName: string; images: { url: string; width?: number; height?: number; alt?: string }[]; title?: string; description?: string; url?: string };

type PageOpenGraph = { title?: string; description?: string; url?: string };

/** The share image drawn by the site itself, used until one is chosen in Settings. */
export const SHARE_IMAGE_PATH = '/share-image.png';
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * Open Graph details for a public page. Next.js replaces the layout's
 * openGraph object wholesale when a page sets its own, so every page builds
 * on this to keep the site name and the social share image.
 */
export async function openGraph(page: PageOpenGraph = {}): Promise<OpenGraph> {
  const { settings, socialImage, version } = await getPublicSettings();
  return {
    type: 'website',
    siteName: settings.siteName,
    images: socialImage
      ? [{ url: socialImage.url, width: socialImage.width ?? undefined, height: socialImage.height ?? undefined }]
      : // Generated from the hero headline; the version changes the address whenever content changes, so shares refresh.
        [{ url: `${SHARE_IMAGE_PATH}?v=${version}`, width: SHARE_IMAGE_SIZE.width, height: SHARE_IMAGE_SIZE.height, alt: settings.siteName }],
    ...page,
  };
}
