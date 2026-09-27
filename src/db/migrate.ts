import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Db } from './client';

const MIGRATIONS_FOLDER = path.join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle');

/** The database cannot be prepared safely as it is. Retrying will not help. */
export class DatabaseMismatchError extends Error {}

/** Applies any migrations in /drizzle that have not run yet. Safe to call on every start. */
export async function runMigrations(db: Db): Promise<void> {
  await adoptUntrackedTables(db);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

type Snapshot = {
  tables: Record<string, { name: string; schema: string; columns: Record<string, { name: string }> }>;
};

/**
 * Tables created without migrations (for example by `drizzle-kit push`)
 * leave no record that the first migration ran, so running it would fail
 * with "relation already exists". When every table and column the first
 * migration creates is already there, record it as applied; later
 * migrations then run as usual. A database holding only part of it is
 * reported and left alone rather than guessed at.
 */
async function adoptUntrackedTables(db: Db): Promise<void> {
  const {
    rows: [journal],
  } = await db.execute<{ found: boolean }>(sql`select to_regclass('drizzle.__drizzle_migrations') is not null as found`);
  if (journal?.found) {
    const {
      rows: [applied],
    } = await db.execute<{ count: number }>(sql`select count(*)::int as count from drizzle.__drizzle_migrations`);
    if (applied && applied.count > 0) return;
  }

  const [first] = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (!first) return;
  const snapshot = JSON.parse(readFileSync(path.join(MIGRATIONS_FOLDER, 'meta', '0000_snapshot.json'), 'utf8')) as Snapshot;
  const expected = Object.values(snapshot.tables).map((table) => ({
    name: `${table.schema || 'public'}.${table.name}`,
    columns: Object.values(table.columns).map((column) => column.name),
  }));

  const { rows } = await db.execute<{ table: string; column_name: string }>(sql`
    select table_schema || '.' || table_name as "table", column_name
    from information_schema.columns
    where table_schema not in ('pg_catalog', 'information_schema')`);
  const existing = new Map<string, Set<string>>();
  for (const row of rows) existing.set(row.table, (existing.get(row.table) ?? new Set()).add(row.column_name));

  // An empty database: the first migration creates everything.
  if (!expected.some((table) => existing.has(table.name))) return;

  const missing = expected.flatMap((table) => {
    const columns = existing.get(table.name);
    if (!columns) return [table.name];
    return table.columns.filter((column) => !columns.has(column)).map((column) => `${table.name}.${column}`);
  });
  if (missing.length) {
    const listed = missing.length > 10 ? `${missing.slice(0, 10).join(', ')}, and ${missing.length - 10} more` : missing.join(', ');
    throw new DatabaseMismatchError(
      `The database already has some of the site's tables but not all of them, so it was left unchanged. Missing: ${listed}. Point DATABASE_URL at an empty database, or have a developer reconcile this one.`,
    );
  }

  // The same journal table the migrator creates, holding the row it would have written.
  await db.execute(sql`create schema if not exists drizzle`);
  await db.execute(sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`);
  await db.execute(sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${first.hash}, ${first.folderMillis})`);
  console.log('[opero] The database already had the site\'s tables; recorded the first migration as applied.');
}
