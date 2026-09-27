/**
 * Sets the password of the admin account named by ADMIN_EMAIL to
 * ADMIN_PASSWORD, creating or re-enabling the account if needed, and signs
 * that account out everywhere. For recovering access if you are locked out.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a new long password' npm run admin:reset-password
 */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function main() {
  const { eq } = await import('drizzle-orm');
  const { db, pool } = await import('../src/db/client');
  const { adminSessions, adminUsers } = await import('../src/db/schema');
  const { hashPassword, MIN_PASSWORD_LENGTH } = await import('../src/server/auth/password');
  const { adminSeed } = await import('../src/server/env');

  const seed = adminSeed();
  if (!seed) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD first.');
    process.exit(1);
  }
  if (seed.password.length < MIN_PASSWORD_LENGTH) {
    console.error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(seed.password);
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, seed.email));
  if (existing) {
    await db.update(adminUsers).set({ passwordHash, disabledAt: null, passwordChangedAt: new Date() }).where(eq(adminUsers.id, existing.id));
    await db.delete(adminSessions).where(eq(adminSessions.userId, existing.id));
    console.log(`Password reset for ${seed.email}. Signed out everywhere.`);
  } else {
    await db.insert(adminUsers).values({ email: seed.email, name: seed.name, passwordHash, passwordChangedAt: new Date() });
    console.log(`Created admin account ${seed.email}.`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
