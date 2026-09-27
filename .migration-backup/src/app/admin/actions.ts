'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_THEME_COOKIE, parseAdminTheme } from '@/server/admin-theme';
import { audit } from '@/server/audit';
import { destroySession, getSession } from '@/server/auth/session';
import { clientIp } from '@/server/request';

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) await audit({ id: session.user.id, email: session.user.email }, 'logout', { ip: await clientIp() });
  await destroySession();
  redirect('/admin/login');
}

/** Remembers the admin's light, dark, or system appearance choice on this device. */
export async function setAdminTheme(theme: string): Promise<void> {
  if (!(await getSession())) return;
  (await cookies()).set(ADMIN_THEME_COOKIE, parseAdminTheme(theme), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 365,
  });
}
