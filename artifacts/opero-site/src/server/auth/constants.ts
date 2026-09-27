/** Session cookie names. The __Host- prefix is used whenever the site is served over HTTPS. */
export const SESSION_COOKIE = '__Host-opero_session';
export const SESSION_COOKIE_INSECURE = 'opero_session';

export const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

/** Admin pages that must work without a session. */
export function isPublicAdminPath(pathname: string): boolean {
  return pathname === '/admin/login' || pathname === '/admin/accept-invite';
}

/** Only allow redirects back into the admin, never to another site. */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) return '/admin';
  if (isPublicAdminPath(next.split('?')[0]!)) return '/admin';
  return next;
}
