import 'server-only';
import { and, asc, eq, gt, max, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { z } from 'zod';
import { DOOR_INVITE_PARAM, DOOR_PATH, GUEST_ROLES, type GuestRole } from '@/content/constants';
import { db } from '@/db/client';
import { guestInvites, guestSessions } from '@/db/schema';
import { GUEST_COOKIE, GUEST_COOKIE_INSECURE, GUEST_TTL_SECONDS } from '@/server/auth/constants';
import { randomToken, sha256 } from '@/server/crypto';
import { sendEmails } from '@/server/email/send';
import { guestEnteredNotification } from '@/server/email/templates';
import { siteUrl } from '@/server/env';
import { clientIp, isHttps, userAgent } from '@/server/request';
import { getSettings, notificationRecipients } from '@/server/settings';

/**
 * Guests: the addresses the owner lets in through the front door (/welcome).
 * A guest who gives one of them gets a session cookie, modeled on the admin
 * session: a random token in an httpOnly cookie, only its SHA-256 stored.
 * Removing an address deletes its invite, its sessions go with it, and the
 * key stops working on the very next request everywhere.
 */

/** `greeting`: the name the site welcomes them by, or empty. */
export type Guest = { inviteId: string; email: string; role: GuestRole; greeting: string; sessionId: string };

const GUEST_TTL_MS = GUEST_TTL_SECONDS * 1000;
/** Extend a session's expiry at most this often. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

/** Rate limits for the door: every try per caller, and the misses per address (the address key holds a hash, never the address). */
export const DOOR_LIMITS = { ip: { limit: 30, windowSeconds: 900 }, address: { limit: 5, windowSeconds: 900 } } as const;

/** Every answer from the door waits until at least this long after it started, hit or miss, so timing gives nothing away. */
export const DOOR_FLOOR_MS = 350;

const isUuid = (value: string) => z.uuid().safeParse(value).success;
const emailShape = z.email();

/** The one form an address is stored and looked up in: trimmed, Unicode NFC, lowercase. */
export function normalizeGuestEmail(input: string): string {
  return input.trim().normalize('NFC').toLowerCase();
}

async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? store.get(GUEST_COOKIE_INSECURE)?.value ?? null;
}

/**
 * The guest for this request, or null. Cached per request. Reads the cookie
 * only: renders cannot set or clear cookies, so a stale cookie simply reads
 * as no guest. A visit older than an hour since the last extends the session.
 */
export const getGuest = cache(async (): Promise<Guest | null> => {
  const token = await readToken();
  if (!token) return null;
  const id = sha256(token);

  const [row] = await db
    .select({
      lastSeenAt: guestSessions.lastSeenAt,
      inviteId: guestInvites.id,
      email: guestInvites.email,
      role: guestInvites.role,
      greeting: guestInvites.greeting,
    })
    .from(guestSessions)
    .innerJoin(guestInvites, eq(guestSessions.inviteId, guestInvites.id))
    .where(and(eq(guestSessions.id, id), gt(guestSessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;

  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db
      .update(guestSessions)
      .set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + GUEST_TTL_MS) })
      .where(eq(guestSessions.id, id));
  }

  return { inviteId: row.inviteId, email: row.email, role: row.role, greeting: row.greeting, sessionId: id };
});

/** The invite for an already-normalized address: one indexed lookup, the same cost whether or not it matches. */
export async function findInvite(email: string): Promise<{ id: string; email: string; role: GuestRole; firstEnteredAt: Date | null } | null> {
  const [row] = await db
    .select({ id: guestInvites.id, email: guestInvites.email, role: guestInvites.role, firstEnteredAt: guestInvites.firstEnteredAt })
    .from(guestInvites)
    .where(eq(guestInvites.email, email))
    .limit(1);
  return row ?? null;
}

/**
 * Starts a guest session for an invite whose address was just given at the
 * door. Only from a Server Action: it sets the cookie.
 */
export async function createGuestSession(inviteId: string): Promise<void> {
  const token = randomToken();
  await db.insert(guestSessions).values({
    id: sha256(token),
    inviteId,
    expiresAt: new Date(Date.now() + GUEST_TTL_MS),
    ip: await clientIp(),
    userAgent: await userAgent(),
  });

  const secure = await isHttps();
  (await cookies()).set(secure ? GUEST_COOKIE : GUEST_COOKIE_INSECURE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_TTL_SECONDS,
  });
}

/** Notes that the invite's address came through the door, and whether this was its first time. */
export async function recordGuestEntry(inviteId: string): Promise<{ firstTime: boolean }> {
  // One statement: both stamps take the same now() on a first entry, so RETURNING can compare them.
  const [row] = await db
    .update(guestInvites)
    .set({ firstEnteredAt: sql`COALESCE(${guestInvites.firstEnteredAt}, now())`, lastEnteredAt: sql`now()` })
    .where(eq(guestInvites.id, inviteId))
    .returning({ firstTime: sql<boolean>`${guestInvites.firstEnteredAt} = ${guestInvites.lastEnteredAt}` });
  return { firstTime: row?.firstTime === true };
}

/** Tells the notification recipients that a guest entered for the first time. Failures are logged, never thrown. */
export async function notifyGuestEntered(invite: { email: string; role: GuestRole }, ip: string): Promise<void> {
  try {
    const settings = await getSettings();
    const message = guestEnteredNotification({ email: invite.email, role: invite.role, ip }, `${siteUrl()}/admin/guests`);
    const results = await sendEmails(notificationRecipients(settings).map((to) => ({ to, ...message })));
    for (const result of results) if (!result.ok) console.error('[opero] Could not send a guest entry notification:', result.error);
  } catch (error) {
    console.error('[opero] Could not send a guest entry notification:', error);
  }
}

export type GuestRow = {
  id: string;
  email: string;
  note: string;
  role: GuestRole;
  createdAt: Date;
  firstEnteredAt: Date | null;
  lastEnteredAt: Date | null;
  /** The latest visit on any of the guest's browsers, or null when none has a session. */
  lastSeenAt: Date | null;
  /** The name the site welcomes them by, or empty. */
  greeting: string;
  /** The secret in their personal link, or null until one is made. */
  linkToken: string | null;
};

/** Every guest on the list, oldest first. */
export async function listGuests(): Promise<GuestRow[]> {
  return db
    .select({
      id: guestInvites.id,
      email: guestInvites.email,
      note: guestInvites.note,
      role: guestInvites.role,
      createdAt: guestInvites.createdAt,
      firstEnteredAt: guestInvites.firstEnteredAt,
      lastEnteredAt: guestInvites.lastEnteredAt,
      lastSeenAt: max(guestSessions.lastSeenAt),
      greeting: guestInvites.greeting,
      linkToken: guestInvites.linkToken,
    })
    .from(guestInvites)
    .leftJoin(guestSessions, eq(guestSessions.inviteId, guestInvites.id))
    .groupBy(guestInvites.id)
    .orderBy(asc(guestInvites.createdAt), asc(guestInvites.email));
}

/** Whether a value names a guest role. */
export function isGuestRole(value: unknown): value is GuestRole {
  return typeof value === 'string' && (GUEST_ROLES as readonly string[]).includes(value);
}

/**
 * Adds addresses to the list, all with the same role and note. Each is
 * normalized and checked for the shape of an email address; ones already on
 * the list are left as they are, role included.
 */
export async function addGuests(
  emails: string[],
  role: GuestRole,
  note: string,
  adminId: string | null,
): Promise<{ added: string[]; existing: string[]; invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const input of emails) {
    const email = normalizeGuestEmail(input);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    if (emailShape.safeParse(email).success && email.length <= 254) valid.push(email);
    else invalid.push(input.trim().slice(0, 200));
  }
  if (!valid.length) return { added: [], existing: [], invalid };

  const inserted = await db
    .insert(guestInvites)
    .values(valid.map((email) => ({ email, role, note: note.trim(), invitedBy: adminId, linkToken: randomToken() })))
    .onConflictDoNothing({ target: guestInvites.email })
    .returning({ email: guestInvites.email });
  const added = new Set(inserted.map((row) => row.email));
  return { added: valid.filter((email) => added.has(email)), existing: valid.filter((email) => !added.has(email)), invalid };
}

/** Changes what a guest may see. Their open sessions follow at once: the role is read with the key on every request. */
export async function setGuestRole(id: string, role: GuestRole): Promise<{ email: string; changed: boolean } | null> {
  if (!isUuid(id)) return null;
  const [before] = await db.select({ email: guestInvites.email, role: guestInvites.role }).from(guestInvites).where(eq(guestInvites.id, id)).limit(1);
  if (!before) return null;
  if (before.role === role) return { email: before.email, changed: false };
  await db.update(guestInvites).set({ role }).where(eq(guestInvites.id, id));
  return { email: before.email, changed: true };
}

/** The shape of a personal link's secret: 32 random bytes in base64url. Checked before any lookup. */
const LINK_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The path of a guest's personal link: the front door with their secret, which fills in their address and greets them. */
export function guestLinkPath(token: string): string {
  return `${DOOR_PATH}?${DOOR_INVITE_PARAM}=${token}`;
}

/** A guest's personal link, in full, for an invitation. */
export function guestLink(token: string): string {
  return `${siteUrl()}${guestLinkPath(token)}`;
}

/**
 * The guest a personal link names, by the secret in it, or null. Only the
 * door asks, to fill in the address and the welcome name; coming in still
 * takes the address, through the door's own action.
 */
export async function findInviteByLink(token: unknown): Promise<{ id: string; email: string; greeting: string } | null> {
  if (typeof token !== 'string' || !LINK_TOKEN.test(token)) return null;
  const [row] = await db
    .select({ id: guestInvites.id, email: guestInvites.email, greeting: guestInvites.greeting })
    .from(guestInvites)
    .where(eq(guestInvites.linkToken, token))
    .limit(1);
  return row ?? null;
}

/**
 * The welcome name the home page greets this visitor by, or empty: a
 * guest's own, from the list. A signed-in admin previewing a guest's
 * personal link lands on the home page with its secret (?invite=), and sees
 * that guest's greeting; anywhere else the parameter means nothing.
 */
export async function greetingFor(admin: boolean, token: unknown): Promise<string> {
  if (admin) return (await findInviteByLink(token))?.greeting ?? '';
  return (await getGuest())?.greeting ?? '';
}

/** Gives a guest a personal link if they have none yet. Returns their address, or null when the id names nobody. */
export async function makeGuestLink(id: string): Promise<{ email: string } | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .update(guestInvites)
    .set({ linkToken: sql`coalesce(${guestInvites.linkToken}, ${randomToken()})` })
    .where(eq(guestInvites.id, id))
    .returning({ email: guestInvites.email });
  return row ?? null;
}

/** Sets the name the site welcomes a guest by (empty for none), and gives them a personal link if they have none, since the link is where the greeting shows first. */
export async function setGuestGreeting(id: string, greeting: string): Promise<{ email: string; changed: boolean } | null> {
  if (!isUuid(id)) return null;
  const [before] = await db.select({ greeting: guestInvites.greeting }).from(guestInvites).where(eq(guestInvites.id, id)).limit(1);
  if (!before) return null;
  const [row] = await db
    .update(guestInvites)
    .set({ greeting, linkToken: sql`coalesce(${guestInvites.linkToken}, ${randomToken()})` })
    .where(eq(guestInvites.id, id))
    .returning({ email: guestInvites.email });
  return row ? { email: row.email, changed: before.greeting !== greeting } : null;
}

/** Takes an address off the list. Its sessions go with it, so its key stops working at once. */
export async function removeGuest(id: string): Promise<{ email: string } | null> {
  if (!isUuid(id)) return null;
  const [row] = await db.delete(guestInvites).where(eq(guestInvites.id, id)).returning({ email: guestInvites.email });
  return row ?? null;
}
