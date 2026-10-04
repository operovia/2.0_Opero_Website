import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MotionRoot } from '@/components/motion/motion-root';
import { AdminDoor } from '@/components/site/admin-door';
import { DemoDialog } from '@/components/site/demo-dialog';
import { MaintenancePage } from '@/components/site/maintenance-page';
import { PreviewBanner } from '@/components/site/preview-banner';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { openGraph } from '@/content/metadata';
import { getPage, getPublicSettings, isPreview } from '@/content/store';
import { dataRoomHidden, withVisibleLinks, type Access } from '@/server/data-room-access';
import { siteUrl } from '@/server/env';

/**
 * The site's metadata: the title template, the description, the share
 * picture, and no indexing while the holding page is up. The gated pages
 * (src/app/(site)) and the open ones (src/app/(open)) share it.
 */
export async function siteMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { template: `%s | ${settings.siteName}`, default: settings.homeMetaTitle },
    description: settings.homeMetaDescription,
    openGraph: await openGraph(),
    twitter: { card: 'summary_large_image' },
    // A holding page must not replace the real site in search results.
    ...(settings.maintenanceMode ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * The site's frame around a page: the header and footer with the links the
 * visitor may see, the demo dialog, the admin's door, and the holding page
 * in maintenance mode. `access` is who is looking: from the gate
 * (requireEntry) for the site's pages, or from getAccess for the pages
 * everyone may read.
 */
export async function SiteFrame({ access, children }: { access: Access; children: ReactNode }) {
  const [{ settings }, site, preview] = await Promise.all([getPublicSettings(), getPage('site'), isPreview()]);

  if (settings.maintenanceMode && !access.admin) return <MaintenancePage content={site.maintenance} />;

  const hubHidden = dataRoomHidden(access);
  const header = withVisibleLinks(site.header, hubHidden, siteUrl());
  const footer = withVisibleLinks(site.footer, hubHidden, siteUrl());

  return (
    <MotionRoot>
      {/* Content that animates in stays visible when JavaScript is off. */}
      <noscript>
        <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-on-accent"
      >
        Skip to content
      </a>
      {preview ? <PreviewBanner /> : null}
      {settings.maintenanceMode ? (
        <p role="status" className="border-b border-warning/40 bg-warning-soft px-gutter py-2 text-center text-sm text-fg">
          Maintenance mode is on. Visitors see the holding page; you see the site because you are signed in.
        </p>
      ) : null}
      <SiteHeader content={header} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter content={footer} email={settings.contactEmail} />
      <DemoDialog content={site.demoForm} />
      {access.admin ? <AdminDoor asVisitor={access.asVisitor === true} /> : null}
      {settings.analyticsSnippet ? <div hidden dangerouslySetInnerHTML={{ __html: settings.analyticsSnippet }} /> : null}
    </MotionRoot>
  );
}
