import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { DOOR_PATH } from '@/content/constants';
import { getPublicSettings } from '@/content/store';
import { getSession } from '@/server/auth/session';
import { getGuest } from '@/server/guests';
import { siteClosed, type Access } from '@/server/investor-hub';

/** Who is looking at this request: a signed-in admin, a guest with a role, or nobody in particular. Cached per request. */
export const getAccess = cache(async (): Promise<Access> => {
  const [session, guest] = await Promise.all([getSession(), getGuest()]);
  return { admin: session !== null, role: guest?.role ?? null };
});

/**
 * The site's gate. Every page in the site's frame calls it first, and so
 * does the frame: a layout is not run again on a client-side navigation, so
 * the frame alone would let a guest whose key was just removed keep
 * browsing. While the site is private, anyone without a key is sent to the
 * front door.
 */
export async function requireEntry(): Promise<Access> {
  const [{ settings }, access] = await Promise.all([getPublicSettings(), getAccess()]);
  if (siteClosed(settings.privateSite, access)) redirect(DOOR_PATH);
  return access;
}
