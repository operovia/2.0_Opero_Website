import { NextResponse, type NextRequest } from 'next/server';
import { isPublicAdminPath, SESSION_COOKIE, SESSION_COOKIE_INSECURE, SESSION_TTL_SECONDS } from '@/server/auth/constants';

/**
 * A fast first gate for the admin: visitors without a session cookie go to
 * the login page. This is only an optimistic check; every admin page, action,
 * and route still verifies the session against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieName = request.cookies.has(SESSION_COOKIE)
    ? SESSION_COOKIE
    : request.cookies.has(SESSION_COOKIE_INSECURE)
      ? SESSION_COOKIE_INSECURE
      : null;

  if (!cookieName && !isPublicAdminPath(pathname)) {
    const login = new URL('/admin/login', request.url);
    if (pathname !== '/admin') login.searchParams.set('next', pathname + search);
    return NextResponse.redirect(login);
  }

  // Let server code know the path, so an expired session can return here after login.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-opero-path', pathname + search);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  // Keep an active admin signed in: refresh the cookie's lifetime on each visit.
  if (cookieName) {
    response.cookies.set(cookieName, request.cookies.get(cookieName)!.value, {
      httpOnly: true,
      secure: cookieName === SESSION_COOKIE,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
  }
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
