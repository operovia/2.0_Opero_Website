import type { Metadata } from 'next';
import { Door } from '@/components/door/door';
import { DOOR_EMAIL_PARAM } from '@/content/constants';
import { getPage, getPublicSettings } from '@/content/store';
import { getAccess } from '@/server/entry';
import { siteUrl } from '@/server/env';
import { doorPrefill } from './prefill';

export async function generateMetadata(): Promise<Metadata> {
  const [{ door }, { settings }] = await Promise.all([getPage('welcome'), getPublicSettings()]);
  return {
    metadataBase: new URL(siteUrl()),
    title: `${door.metaTitle} | ${settings.siteName}`,
    description: door.metaDescription,
    robots: { index: false, follow: false },
  };
}

/**
 * The front door. It never redirects on the server: the action that sets
 * the guest cookie re-renders this page, and a redirect thrown here would
 * navigate out from under the dissolving door. Whoever already has a way in,
 * a guest whose browser holds the key or a signed-in admin, is handled on
 * the door itself, which reads `alreadyIn` once. A link can carry the
 * invited address in ?email=, which the door fills in.
 */
export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const [{ door }, { settings }, access, params] = await Promise.all([getPage('welcome'), getPublicSettings(), getAccess(), searchParams]);
  return (
    <Door
      content={door}
      contactEmail={settings.contactEmail}
      alreadyIn={access.admin || access.role !== null}
      publicSite={!settings.privateSite}
      prefill={doorPrefill(params[DOOR_EMAIL_PARAM])}
    />
  );
}
