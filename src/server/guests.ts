import 'server-only';
import { and, asc, count, eq, gt, isNull, lt, max, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { z } from 'zod';
import { DOOR_CONFIRM_PARAM, DOOR_INVITE_PARAM, DOOR_PATH, GUEST_ROLES, type GuestRole } from '@/content/constants';
import { db } from '@/db/client';
import { guestConfirmations, guestDomains, guestInvites, guestSessions } from '@/db/schema';
import { isPublicEmailDomain, normalizeDomain } from '@/lib/guest-domains';
import { GUEST_COOKIE, GUEST_COOKIE_INSECURE, GUEST_TTL_SECONDS } from '@/server/auth/constants';
import { randomToken, sha256 } from '@/server/crypto';
import { sendEmail, sendEmails } from '@/server/email/send';
import { guestConfirmLinkEmail, guestEnteredNotification } from '@/server/email/templates';
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

/**
 * Rate limits for the door: every try per caller, the misses per address (the
 * address key holds a hash, never the address), and the links it emails, per
 * address and per company, so nobody can make it send mail at will.
 */
export const DOOR_LIMITS = {
  ip: { limit: 30, windowSeconds: 900 },
  address: { limit: 5, windowSeconds: 900 },
  link: { limit: 3, windowSeconds: 3600 },
  company: { limit: 20, windowSeconds: 3600 },
} as const;

/** How long a link the door emails keeps working, once. */
export const CONFIRM_TTL_HOURS = 24;
const CONFIRM_TTL_MS = CONFIRM_TTL_HOURS * 60 * 60 * 1000;

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

/** A guest the door found: `company` is the domain they came in through, or null for an address the owner added. */
export type InviteMatch = { id: string; email: string; role: GuestRole; firstEnteredAt: Date | null; companyId: string | null; company: string | null };

const inviteMatch = {
  id: guestInvites.id,
  email: guestInvites.email,
  role: guestInvites.role,
  firstEnteredAt: guestInvites.firstEnteredAt,
  companyId: guestInvites.domainId,
  company: guestDomains.domain,
};

/** The invite for an already-normalized address: one indexed lookup, the same cost whether or not it matches. */
export async function findInvite(email: string): Promise<InviteMatch | null> {
  const [row] = await db
    .select(inviteMatch)
    .from(guestInvites)
    .leftJoin(guestDomains, eq(guestInvites.domainId, guestDomains.id))
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
export async function notifyGuestEntered(invite: { email: string; role: GuestRole; company?: string | null }, ip: string): Promise<void> {
  try {
    const settings = await getSettings();
    const message = guestEnteredNotification({ email: invite.email, role: invite.role, ip, company: invite.company }, `${siteUrl()}/admin/guests`);
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
  /** The company they came in through, or null for an address the owner added. */
  company: string | null;
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
      company: guestDomains.domain,
    })
    .from(guestInvites)
    .leftJoin(guestSessions, eq(guestSessions.inviteId, guestInvites.id))
    .leftJoin(guestDomains, eq(guestInvites.domainId, guestDomains.id))
    .groupBy(guestInvites.id, guestDomains.id)
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

/* ------------------------------------------------------------------------ */
/* Companies: everyone at a domain, confirmed by email                      */
/* ------------------------------------------------------------------------ */

/** A company on the list: its domain, what its people may see, and the name they are welcomed by. */
export type Company = { id: string; domain: string; role: GuestRole; greeting: string };

const companyColumns = { id: guestDomains.id, domain: guestDomains.domain, role: guestDomains.role, greeting: guestDomains.greeting };

/** The company on the list with this domain, or null. */
export async function findCompany(domain: string): Promise<Company | null> {
  const [row] = await db.select(companyColumns).from(guestDomains).where(eq(guestDomains.domain, domain)).limit(1);
  return row ?? null;
}

/** The company with this id, or null. */
export async function findCompanyById(id: string): Promise<Company | null> {
  if (!isUuid(id)) return null;
  const [row] = await db.select(companyColumns).from(guestDomains).where(eq(guestDomains.id, id)).limit(1);
  return row ?? null;
}

/** The link the door emails: the front door with the secret, which fills in the address it was sent to. */
export function confirmLink(token: string): string {
  return `${siteUrl()}${DOOR_PATH}?${DOOR_CONFIRM_PARAM}=${token}`;
}

/**
 * Makes a one-time link for someone at a company on the list and returns its
 * secret; only its fingerprint is kept. Links that ran out a week ago go.
 */
export async function startConfirmation(email: string, companyId: string): Promise<string> {
  const token = randomToken();
  await db.delete(guestConfirmations).where(lt(guestConfirmations.expiresAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  await db.insert(guestConfirmations).values({ id: sha256(token), email, domainId: companyId, expiresAt: new Date(Date.now() + CONFIRM_TTL_MS) });
  return token;
}

/** Emails the link to the address it is for. Failures are logged, never thrown: the door has answered already. */
export async function sendConfirmLink(email: string, token: string): Promise<void> {
  try {
    const result = await sendEmail({ to: email, ...guestConfirmLinkEmail({ email, url: confirmLink(token), hours: CONFIRM_TTL_HOURS }) });
    if (!result.ok) console.error('[opero] Could not email a link to the door:', result.error);
  } catch (error) {
    console.error('[opero] Could not email a link to the door:', error);
  }
}

/**
 * An emailed link by its secret: the address it was sent to, the company's
 * welcome name, and whether it still works (unused, and in time); null when
 * it names nothing. Only the door asks, to fill in the address; coming in
 * still takes the door's own action.
 */
export async function findConfirmation(token: unknown): Promise<{ email: string; greeting: string; works: boolean } | null> {
  if (typeof token !== 'string' || !LINK_TOKEN.test(token)) return null;
  const [row] = await db
    .select({ email: guestConfirmations.email, greeting: guestDomains.greeting, usedAt: guestConfirmations.usedAt, expiresAt: guestConfirmations.expiresAt })
    .from(guestConfirmations)
    .innerJoin(guestDomains, eq(guestConfirmations.domainId, guestDomains.id))
    .where(eq(guestConfirmations.id, sha256(token)))
    .limit(1);
  if (!row) return null;
  return { email: row.email, greeting: row.greeting, works: row.usedAt === null && row.expiresAt.getTime() > Date.now() };
}

/**
 * Spends an emailed link given at the door with the address it was sent to,
 * and returns the guest it lets in: made now if they are new, with the
 * company's role and welcome name, noted as having come in through it. Null
 * for a link that is spent, ran out, or was sent to another address. One
 * statement spends it, so a link lets in once however often it is pressed.
 */
export async function spendConfirmation(token: string, email: string): Promise<InviteMatch | null> {
  if (!LINK_TOKEN.test(token)) return null;
  return db.transaction(async (tx) => {
    const [spent] = await tx
      .update(guestConfirmations)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(guestConfirmations.id, sha256(token)),
          eq(guestConfirmations.email, email),
          isNull(guestConfirmations.usedAt),
          gt(guestConfirmations.expiresAt, new Date()),
        ),
      )
      .returning({ companyId: guestConfirmations.domainId });
    if (!spent) return null;
    const [company] = await tx.select().from(guestDomains).where(eq(guestDomains.id, spent.companyId)).limit(1);
    if (!company) return null;
    await tx
      .insert(guestInvites)
      .values({
        email,
        role: company.role,
        greeting: company.greeting,
        invitedBy: company.invitedBy,
        domainId: company.id,
      })
      .onConflictDoNothing({ target: guestInvites.email });
    const [invite] = await tx
      .select(inviteMatch)
      .from(guestInvites)
      .leftJoin(guestDomains, eq(guestInvites.domainId, guestDomains.id))
      .where(eq(guestInvites.email, email))
      .limit(1);
    return invite ?? null;
  });
}

export type CompanyRow = Company & { note: string; createdAt: Date; members: number };

/** Every company on the list, oldest first, with how many of its people have come in. */
export async function listCompanies(): Promise<CompanyRow[]> {
  return db
    .select({ ...companyColumns, note: guestDomains.note, createdAt: guestDomains.createdAt, members: count(guestInvites.id) })
    .from(guestDomains)
    .leftJoin(guestInvites, eq(guestInvites.domainId, guestDomains.id))
    .groupBy(guestDomains.id)
    .orderBy(asc(guestDomains.createdAt), asc(guestDomains.domain));
}

/**
 * Adds a company by its domain, typed any way the owner likes (example.com,
 * @example.com, or someone's address there). Refuses what is not a domain, and
 * the email services anyone can sign up for; one already on the list is kept
 * as it is.
 */
export async function addCompany(
  input: string,
  role: GuestRole,
  note: string,
  greeting: string,
  adminId: string | null,
): Promise<{ status: 'added' | 'existing' | 'invalid' | 'public'; domain: string }> {
  const domain = normalizeDomain(input);
  if (!domain) return { status: 'invalid', domain: input.trim() };
  if (isPublicEmailDomain(domain)) return { status: 'public', domain };
  const inserted = await db
    .insert(guestDomains)
    .values({ domain, role, note: note.trim(), greeting, invitedBy: adminId })
    .onConflictDoNothing({ target: guestDomains.domain })
    .returning({ id: guestDomains.id });
  return { status: inserted.length ? 'added' : 'existing', domain };
}

/** Changes what a company's people may see, theirs too: their open sessions follow at once. */
export async function setCompanyRole(id: string, role: GuestRole): Promise<{ domain: string; changed: boolean } | null> {
  const company = await findCompanyById(id);
  if (!company) return null;
  if (company.role === role) return { domain: company.domain, changed: false };
  await db.transaction(async (tx) => {
    await tx.update(guestDomains).set({ role }).where(eq(guestDomains.id, id));
    await tx.update(guestInvites).set({ role }).where(eq(guestInvites.domainId, id));
  });
  return { domain: company.domain, changed: true };
}

/** Sets the name a company's people are welcomed by (empty for none), theirs too. */
export async function setCompanyGreeting(id: string, greeting: string): Promise<{ domain: string; changed: boolean } | null> {
  const company = await findCompanyById(id);
  if (!company) return null;
  if (company.greeting === greeting) return { domain: company.domain, changed: false };
  await db.transaction(async (tx) => {
    await tx.update(guestDomains).set({ greeting }).where(eq(guestDomains.id, id));
    await tx.update(guestInvites).set({ greeting }).where(eq(guestInvites.domainId, id));
  });
  return { domain: company.domain, changed: true };
}

/** Takes a company off the list, with everyone who came in through it and their unused links: their keys stop working at once. */
export async function removeCompany(id: string): Promise<{ domain: string; members: number } | null> {
  if (!isUuid(id)) return null;
  const [members] = await db.select({ n: count() }).from(guestInvites).where(eq(guestInvites.domainId, id));
  const [row] = await db.delete(guestDomains).where(eq(guestDomains.id, id)).returning({ domain: guestDomains.domain });
  return row ? { domain: row.domain, members: members?.n ?? 0 } : null;
}
