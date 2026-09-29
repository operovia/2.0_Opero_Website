import { DemoDialog } from '@/components/site/demo-dialog';
import { MaintenancePage } from '@/components/site/maintenance-page';
import { NotFoundContent } from '@/components/site/not-found-content';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getPage, getPublicSettings } from '@/content/store';
import { plainHeadline } from '@/lib/headline';
import { getSession } from '@/server/auth/session';
import { siteUrl } from '@/server/env';
import { getGuest } from '@/server/guests';
import { investorHubHidden, withVisibleLinks } from '@/server/investor-hub';

/** An address that matches no page. It has no site frame around it, so it brings its own header and footer. */
export default async function NotFound() {
  const [site, { settings }, session, guest] = await Promise.all([getPage('site'), getPublicSettings(), getSession(), getGuest()]);
  if (settings.maintenanceMode && !session) return <MaintenancePage content={site.maintenance} />;
  const hubHidden = investorHubHidden(session !== null || guest !== null);
  return (
    <>
      {/* Not-found pages take no metadata export; React moves this title into the head. */}
      <title>{`${plainHeadline(site.notFound.headline).replace(/[.!]$/, '')} | ${settings.siteName}`}</title>
      <SiteHeader content={withVisibleLinks(site.header, hubHidden, siteUrl())} />
      <main id="main">
        <NotFoundContent content={site.notFound} />
      </main>
      <SiteFooter content={withVisibleLinks(site.footer, hubHidden, siteUrl())} email={settings.contactEmail} />
      <DemoDialog content={site.demoForm} />
    </>
  );
}
