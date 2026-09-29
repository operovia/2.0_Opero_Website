import { count, eq } from 'drizzle-orm';
import { allSections } from '@/content/registry';
import { seedScenes } from '@/content/seed-scenes';
import type { Db } from '@/db/client';
import { adminUsers, consoleScenes, contentSections, contentVersions, siteSettings, siteState } from '@/db/schema';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/server/auth/password';
import { adminSeed } from '@/server/env';

/**
 * First-run data. Every step is idempotent: it only inserts what is missing,
 * so it runs safely on every server start and never overwrites edits.
 */

export const defaultSettings = {
  siteName: 'Opero',
  contactEmail: 'hello@operovia.com',
  partnerProgramLabel: 'design partner',
  homeMetaTitle: 'Opero: The AI-driven operating platform for property management',
  homeMetaDescription:
    'One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step.',
};

async function seedAdmin(db: Db): Promise<void> {
  const [{ admins }] = await db.select({ admins: count() }).from(adminUsers);
  if (admins > 0) return;

  const seed = adminSeed();
  if (!seed) {
    console.warn('[opero] No admin account exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, then restart.');
    return;
  }
  if (seed.password.length < MIN_PASSWORD_LENGTH) {
    console.warn(`[opero] ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters. No admin was created.`);
    return;
  }
  await db.insert(adminUsers).values({
    email: seed.email,
    name: seed.name,
    passwordHash: await hashPassword(seed.password),
    passwordChangedAt: new Date(),
  });
  console.log(`[opero] Created the first admin account for ${seed.email}.`);
}

async function seedSettings(db: Db): Promise<void> {
  const existing = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.id, 1));
  if (existing.length) return;
  const seed = adminSeed();
  await db.insert(siteSettings).values({
    id: 1,
    ...defaultSettings,
    notificationRecipients: seed ? [seed.email] : [],
  });
}

async function seedSiteState(db: Db): Promise<void> {
  await db.insert(siteState).values({ id: 1 }).onConflictDoNothing();
}

/**
 * Inserts any content section that does not exist yet, as version 1. The
 * console scenes are seeded only on the very first run, so deleting them
 * later does not bring them back.
 */
async function seedContent(db: Db): Promise<void> {
  const [{ sections }] = await db.select({ sections: count() }).from(contentSections);
  const firstRun = sections === 0;

  for (const { page, section, def } of allSections()) {
    const [inserted] = await db
      .insert(contentSections)
      .values({ page, section, draft: def.seed, published: def.seed, version: 1, needsReview: Boolean(def.draftCopy) })
      .onConflictDoNothing()
      .returning({ id: contentSections.id });
    if (inserted) {
      await db.insert(contentVersions).values({ sectionId: inserted.id, version: 1, data: def.seed, note: 'Initial content' });
    }
  }

  if (firstRun) {
    const [{ scenes }] = await db.select({ scenes: count() }).from(consoleScenes);
    if (scenes === 0) await db.insert(consoleScenes).values(seedScenes.map((scene, position) => ({ ...scene, position })));
  }
}

export async function seed(db: Db): Promise<void> {
  await seedSiteState(db);
  await seedSettings(db);
  await seedAdmin(db);
  await seedContent(db);
}
