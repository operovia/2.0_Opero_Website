import type { Metadata } from 'next';
import { Door } from '@/components/door/door';
import { getPage, getPublicSettings } from '@/content/store';
import { siteUrl } from '@/server/env';
import { getGuest } from '@/server/guests';

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
 * navigate out from under the dissolving door. A guest whose browser already
 * holds the key is handled on the door itself, which reads `alreadyIn` once.
 */
export default async function WelcomePage() {
  const [{ door }, { settings }, guest] = await Promise.all([getPage('welcome'), getPublicSettings(), getGuest()]);
  return <Door content={door} contactEmail={settings.contactEmail} alreadyIn={guest !== null} />;
}
