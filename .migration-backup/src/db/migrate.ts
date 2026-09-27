import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Db } from './client';

/** Applies any migrations in /drizzle that have not run yet. Safe to call on every start. */
export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
}
