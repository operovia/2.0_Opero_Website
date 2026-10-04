import type { Metadata } from 'next';
import { Door } from '@/components/door/door';
import { DOOR_EMAIL_PARAM, DOOR_INVITE_PARAM } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage, getPublicSettings } from '@/content/store';
import { getAccess } from '@/server/entry';
import { siteUrl } from '@/server/env';
import { findInviteByLink, getGuest } from '@/server/guests';
import { doorPrefill } from './prefill';

export async function generateMetadata(): Promise<Metadata> {
  const [{ door }, { settings }] = await Promise.all([getPage('welcome'), getPublicSettings()]);
  return {
    metadataBase: new URL(siteUrl()),
    title: `${door.metaTitle} | ${settings.siteName}`,
    description: door.metaDescription,
    // A shared link to the site opens on the door while the site is private, so the preview shows the site's own title, description and picture.
    openGraph: await openGraph({ title: settings.homeMetaTitle, description: settings.homeMetaDescription, url: '/' }),
    twitter: { card: 'summary_large_image' },
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
 *
 * A guest's personal link (?invite=) carries a secret made for them, which
 * nobody can guess, so the door may say who it is for: it fills in their
 * address and, with a welcome name on the guest list, greets them by it and
 * rolls out the red carpet. A secret that names nobody gets the plain door,
 * the same as no secret. A signed-in admin who opens one sees the door as
 * the guest will (enterDoor never gives an admin a guest key, so the guest's
 * first visit stays theirs) and lands on the home page with the guest's
 * greeting.
 */
export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const [{ door }, { footer }, { settings }, access, guest, params] = await Promise.all([
    getPage('welcome'),
    getPage('site'),
    getPublicSettings(),
    getAccess(),
    getGuest(),
    searchParams,
  ]);
  // The privacy notice's link, as the site's footer has it; the notice is open to everyone.
  const privacy = footer.links.find((link) => link.href === '/privacy') ?? null;
  const token = params[DOOR_INVITE_PARAM];
  const invited = await findInviteByLink(token);
  const preview = access.admin && invited !== null;
  const alreadyIn = !preview && (access.admin || access.role !== null);
  // A guest already in hears the greeting only on their own link.
  const greeting = invited && (!alreadyIn || guest?.inviteId === invited.id) ? invited.greeting : '';
  return (
    <Door
      content={door}
      contactEmail={settings.contactEmail}
      privacy={privacy}
      alreadyIn={alreadyIn}
      publicSite={!settings.privateSite}
      prefill={invited?.email ?? doorPrefill(params[DOOR_EMAIL_PARAM])}
      greeting={greeting}
      preview={preview}
      destination={preview && greeting && typeof token === 'string' ? `/?${DOOR_INVITE_PARAM}=${token}` : '/'}
    />
  );
}
