import { NotFoundContent } from '@/components/site/not-found-content';
import { getPage, getPublicSettings } from '@/content/store';
import { plainHeadline } from '@/lib/headline';

/**
 * A page in the site's frame that is not there, such as the Investor Hub
 * while it is hidden. The frame already has the header and footer, so this is
 * only the message; addresses that match no page get src/app/not-found.tsx.
 */
export default async function SiteNotFound() {
  const [site, { settings }] = await Promise.all([getPage('site'), getPublicSettings()]);
  return (
    <>
      {/* Not-found pages take no metadata export; React moves this title into the head. */}
      <title>{`${plainHeadline(site.notFound.headline).replace(/[.!]$/, '')} | ${settings.siteName}`}</title>
      <NotFoundContent content={site.notFound} />
    </>
  );
}
