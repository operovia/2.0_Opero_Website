import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import { db, adminSessions, adminUsers } from '@workspace/db';
import { randomToken, sha256 } from '@/server/crypto';
import { clientIp, clearCookie, currentRequest, isHttps, readCookie, userAgent, writeCookie } from '@/server/request';
import { SESSION_COOKIE, SESSION_COOKIE_INSECURE, SESSION_TTL_SECONDS } from './constants';

export type AdminUser = { id: string; email: string; name: string };
export type AdminSession = { sessionId: string; user: AdminUser };
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

function token(): string | null {
  return readCookie(SESSION_COOKIE) ?? readCookie(SESSION_COOKIE_INSECURE);
}

export async function createSession(userId: string): Promise<void> {
  const value = randomToken();
  const secure = await isHttps();
  await db.insert(adminSessions).values({
    id: sha256(value), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    ip: await clientIp(), userAgent: await userAgent(),
  });
  writeCookie(secure ? SESSION_COOKIE : SESSION_COOKIE_INSECURE, value, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<AdminSession | null> {
  const value = token();
  if (!value) return null;
  const id = sha256(value);
  const [row] = await db.select({
    lastSeenAt: adminSessions.lastSeenAt,
    id: adminUsers.id, email: adminUsers.email, name: adminUsers.name,
  }).from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date()), isNull(adminUsers.disabledAt)))
    .limit(1);
  if (!row) return null;
  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.update(adminSessions).set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(adminSessions.id, id));
  }
  return { sessionId: id, user: { id: row.id, email: row.email, name: row.name } };
}

/** Used only by APIs; unauthorized requests are rejected with an error rather than redirected. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (session) return session;
  throw Object.assign(new Error('Authentication required'), { status: 401 });
}

export async function destroySession(): Promise<void> {
  const value = token();
  if (value) await db.delete(adminSessions).where(eq(adminSessions.id, sha256(value)));
  const secure = await isHttps();
  clearCookie(SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  clearCookie(SESSION_COOKIE_INSECURE, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  // A context-free call is deliberately a no-op for cookie writing.
  void currentRequest();
}

export async function destroyOtherSessions(userId: string, keepSessionId: string): Promise<void> {
  await db.delete(adminSessions).where(and(eq(adminSessions.userId, userId), ne(adminSessions.id, keepSessionId)));
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}