'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FOUNDER_PATH } from '@/content/constants';
import { publicPath } from '@/content/paths';
import { requireAdmin } from '@/server/auth/session';
import { siteUrl } from '@/server/env';
import { linksToDataRoom } from '@/server/data-room-access';
import { isHttps } from '@/server/request';
import { VISITOR_VIEW_COOKIE } from '@/server/visitor-view';

/**
 * Lets an admin see the site as a visitor does, with the Founder page in the
 * header and the Investor Hub hidden, or go back to the admin's own view. It
 * stays on the same page, except that turning it on from the Investor Hub,
 * which visitors cannot see, lands on the Founder page they get instead.
 */
export async function setVisitorView(formData: FormData): Promise<void> {
  await requireAdmin();
  const on = formData.get('view') === 'visitor';
  const store = await cookies();
  if (on) store.set(VISITOR_VIEW_COOKIE, '1', { httpOnly: true, secure: await isHttps(), sameSite: 'lax', path: '/' });
  else store.delete(VISITOR_VIEW_COOKIE);
  const path = publicPath(String(formData.get('path') ?? '/'));
  redirect(on && linksToDataRoom(path, siteUrl()) ? FOUNDER_PATH : path);
}
