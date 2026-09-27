import { Aurora } from '@/components/site/aurora';
import { DemoDialog } from '@/components/site/demo-dialog';
import { Container, Eyebrow, SiteButton } from '@/components/site/layout-parts';
import { MaintenancePage } from '@/components/site/maintenance-page';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getPage, getPublicSettings } from '@/content/store';
import { getSession } from '@/server/auth/session';

export default async function NotFound() {
  const [site, { settings }, session] = await Promise.all([getPage('site'), getPublicSettings(), getSession()]);
  if (settings.maintenanceMode && !session) return <MaintenancePage content={site.maintenance} />;
  return (
    <>
      {/* Not-found pages take no metadata export; React moves this title into the head. */}
      <title>{`${site.notFound.headline.replace(/[.!]$/, '')} | ${settings.siteName}`}</title>
      <SiteHeader content={site.header} />
      <main id="main" className="relative isolate overflow-hidden">
        <Aurora intensity={0.6} />
        <Container className="flex min-h-[60dvh] flex-col items-center justify-center py-section text-center">
          <Eyebrow>404</Eyebrow>
          <h1 className="mt-5 max-w-2xl text-display-md font-medium text-metal">{site.notFound.headline}</h1>
          <p className="mt-6 max-w-xl text-lg text-fg-muted">{site.notFound.body}</p>
          <SiteButton href="/" size="lg" className="mt-10">
            {site.notFound.buttonLabel}
          </SiteButton>
        </Container>
      </main>
      <SiteFooter content={site.footer} email={settings.contactEmail} />
      <DemoDialog content={site.demoForm} />
    </>
  );
}
