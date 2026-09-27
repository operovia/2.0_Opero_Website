import 'server-only';
import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/db/client';
import { adminSessions, adminUsers } from '@/db/schema';
import { randomToken, sha256 } from '@/server/crypto';
import { clientIp, isHttps, userAgent } from '@/server/request';
import { SESSION_COOKIE, SESSION_COOKIE_INSECURE, SESSION_TTL_SECONDS } from './constants';

export type AdminUser = { id: string; email: string; name: string };
export type AdminSession = { sessionId: string; user: AdminUser };

const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
/** Extend a session's expiry at most this often. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? store.get(SESSION_COOKIE_INSECURE)?.value ?? null;
}

/**
 * Starts a session for a user who just proved who they are. The random token
 * goes in an httpOnly cookie; only its SHA-256 is stored.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    ip: await clientIp(),
    userAgent: await userAgent(),
  });

  const secure = await isHttps();
  (await cookies()).set(secure ? SESSION_COOKIE : SESSION_COOKIE_INSECURE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** The signed-in admin for this request, or null. Cached per request. */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const token = await readToken();
  if (!token) return null;
  const id = sha256(token);

  const [row] = await db
    .select({
      lastSeenAt: adminSessions.lastSeenAt,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date()), isNull(adminUsers.disabledAt)))
    .limit(1);
  if (!row) return null;

  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db
      .update(adminSessions)
      .set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(adminSessions.id, id));
  }

  return { sessionId: id, user: { id: row.id, email: row.email, name: row.name } };
});

/**
 * Guards every admin page and Server Action. Sends visitors without a valid
 * session to the login page, remembering where they were headed.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (session) return session;
  const path = (await headers()).get('x-opero-path');
  redirect(path && path !== '/admin' ? `/admin/login?next=${encodeURIComponent(path)}` : '/admin/login');
}

/** Ends the current session and clears its cookie. */
export async function destroySession(): Promise<void> {
  const token = await readToken();
  if (token) await db.delete(adminSessions).where(eq(adminSessions.id, sha256(token)));
  const store = await cookies();
  // A __Host- cookie can only be replaced by another Secure, path=/ cookie.
  store.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  store.delete(SESSION_COOKIE_INSECURE);
}

/** Signs a user out everywhere except the given session (after a password change). */
export async function destroyOtherSessions(userId: string, keepSessionId: string): Promise<void> {
  await db.delete(adminSessions).where(and(eq(adminSessions.userId, userId), ne(adminSessions.id, keepSessionId)));
}

/** Signs a user out everywhere (when an admin is removed). */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}
