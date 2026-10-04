import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { Db } from './client';
import { sqlState } from './errors';

const MIGRATIONS_FOLDER = path.join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle');

/** The database cannot be prepared safely as it is. Retrying will not help. */
export class DatabaseMismatchError extends Error {}

/**
 * Applies the migrations in /drizzle the database still needs, and makes
 * sure each of them really did run. The record (drizzle.__drizzle_migrations,
 * the one Drizzle's own migrator keeps) vouches for a migration when it holds
 * the file's hash: everything after the last one it vouches for, and
 * everything from the first migration whose tables and columns are not all
 * there, is applied statement by statement, skipping what is already in
 * place. Going by the hashes rather than by date, as Drizzle's migrator
 * does, means a stray row dated after every migration cannot make it skip
 * them all, and a table that exists ahead of its migration (made by another
 * tool, or by a run the record lost) cannot stop a start: Drizzle's migrator
 * would fail on it with "relation already exists". Safe to call on every
 * start.
 */
export async function runMigrations(db: Db): Promise<{ repaired: string[] }> {
  await adoptUntrackedTables(db);
  await ensureRecord(db);
  const plan = await planMigrations(db);
  for (const migration of plan.todo) await applyAgain(db, migration, plan.recorded.has(migration.hash));
  return { repaired: plan.todo.map((migration) => migration.tag) };
}

/* ------------------------------------------------------------------------ */
/* The migrations on disk and the schema they describe                      */
/* ------------------------------------------------------------------------ */

export type Migration = { tag: string; idx: number; when: number; hash: string; statements: string[] };

type Snapshot = {
  tables: Record<string, { name: string; schema: string; columns: Record<string, { name: string }> }>;
};

/** Tables with their columns, keyed "schema.table". */
type Tables = Map<string, Set<string>>;

// The files do not change while a production server runs; in development they do, so they are read each time.
const cache = process.env.NODE_ENV === 'production' ? { migrations: null as Migration[] | null, snapshots: new Map<number, Tables>() } : null;

function readMigrations(): Migration[] {
  if (cache?.migrations) return cache.migrations;
  const journal = JSON.parse(readFileSync(path.join(MIGRATIONS_FOLDER, 'meta', '_journal.json'), 'utf8')) as {
    entries: { idx: number; tag: string; when: number }[];
  };
  const files = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  const migrations = journal.entries.map((entry, i) => {
    const file = files[i];
    if (!file) throw new Error(`Migration ${entry.tag} has no file.`);
    return { tag: entry.tag, idx: entry.idx, when: entry.when, hash: file.hash, statements: file.sql };
  });
  if (cache) cache.migrations = migrations;
  return migrations;
}

/** The tables and columns a migration's snapshot says exist once it has run. */
function snapshotTables(idx: number): Tables {
  const cached = cache?.snapshots.get(idx);
  if (cached) return cached;
  const snapshot = JSON.parse(readFileSync(path.join(MIGRATIONS_FOLDER, 'meta', `${String(idx).padStart(4, '0')}_snapshot.json`), 'utf8')) as Snapshot;
  const tables: Tables = new Map();
  for (const table of Object.values(snapshot.tables)) {
    tables.set(`${table.schema || 'public'}.${table.name}`, new Set(Object.values(table.columns).map((column) => column.name)));
  }
  cache?.snapshots.set(idx, tables);
  return tables;
}

/** The tables and columns the database has, outside Postgres's own schemas. */
async function databaseTables(db: Db): Promise<Tables> {
  const { rows } = await db.execute<{ table: string; column_name: string }>(sql`
    select table_schema || '.' || table_name as "table", column_name
    from information_schema.columns
    where table_schema not in ('pg_catalog', 'information_schema')`);
  const tables: Tables = new Map();
  for (const row of rows) tables.set(row.table, (tables.get(row.table) ?? new Set()).add(row.column_name));
  return tables;
}

/** What `expected` has that `actual` lacks: "schema.table" or "schema.table.column". */
export function missingFrom(expected: Tables, actual: Tables): string[] {
  return [...expected].flatMap(([table, columns]) => {
    const present = actual.get(table);
    if (!present) return [table];
    return [...columns].filter((column) => !present.has(column)).map((column) => `${table}.${column}`);
  });
}

/** Only what `keep` still has: tables and columns a later migration drops or renames are not expected to be there. */
export function intersect(tables: Tables, keep: Tables): Tables {
  const result: Tables = new Map();
  for (const [table, columns] of tables) {
    const kept = keep.get(table);
    if (kept) result.set(table, new Set([...columns].filter((column) => kept.has(column))));
  }
  return result;
}

/* ------------------------------------------------------------------------ */
/* Checking the record against the files and the database                  */
/* ------------------------------------------------------------------------ */

export type MigrationPlan<M = Migration> = {
  /** Migrations to apply (again), oldest first. */
  todo: M[];
  /** Hashes in the migrator's record. */
  recorded: Set<string>;
  /** What the database lacks of the newest migration's tables and columns. */
  missing: string[];
};

/**
 * Which migrations to apply again. The record vouches for a migration when
 * it holds the file's hash; anything after the last one it vouches for never
 * ran. And from the first migration whose tables or columns are not all
 * there, everything must run again: what is there already is skipped.
 */
export function planFrom<M extends { hash: string }>(migrations: M[], recorded: Set<string>, missing: string[][]): MigrationPlan<M> {
  let proven = -1;
  migrations.forEach((migration, i) => {
    if (recorded.has(migration.hash)) proven = i;
  });
  const firstIncomplete = missing.findIndex((list) => list.length > 0);
  const start = Math.min(proven + 1, firstIncomplete === -1 ? migrations.length : firstIncomplete);
  return { todo: migrations.slice(start), recorded, missing: missing.at(-1) ?? [] };
}

async function recordedHashes(db: Db): Promise<Set<string>> {
  const {
    rows: [journal],
  } = await db.execute<{ found: boolean }>(sql`select to_regclass('drizzle.__drizzle_migrations') is not null as found`);
  if (!journal?.found) return new Set();
  const { rows } = await db.execute<{ hash: string }>(sql`select hash from drizzle.__drizzle_migrations`);
  return new Set(rows.map((row) => row.hash));
}

/** The migrations the database still needs, by its record and by what it holds. */
export async function planMigrations(db: Db): Promise<MigrationPlan> {
  const migrations = readMigrations();
  const last = migrations.at(-1);
  if (!last) return { todo: [], recorded: new Set(), missing: [] };
  const [recorded, actual] = await Promise.all([recordedHashes(db), databaseTables(db)]);
  const final = snapshotTables(last.idx);
  const missing = migrations.map((migration) => missingFrom(intersect(snapshotTables(migration.idx), final), actual));
  return planFrom(migrations, recorded, missing);
}

/* ------------------------------------------------------------------------ */
/* Applying a migration to a database that may already have parts of it     */
/* ------------------------------------------------------------------------ */

const withoutComments = (statement: string) =>
  statement
    .replace(/^\s*--.*$/gm, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

/**
 * Whether a statement's failure means its work was already done: a table,
 * index, constraint or column it creates exists, or one it drops is gone.
 * Anything else, a data change included, is a real failure.
 */
export function tolerated(statement: string, code: string | null): boolean {
  if (!code) return false;
  const text = withoutComments(statement);
  if (text.startsWith('create ')) return ['42P07', '42710', '42P06', '42723'].includes(code);
  if (/^alter table .* add column /.test(text)) return code === '42701';
  if (/^alter table .* add constraint /.test(text)) return code === '42710';
  if (/^alter table .* drop column /.test(text)) return code === '42703';
  if (/^alter table .* drop constraint /.test(text)) return code === '42704';
  if (text.startsWith('drop ')) return ['42P01', '42704'].includes(code);
  return false;
}

/** The migrator's record, as Drizzle's own migrator makes it, so a fresh database can take its first migration. */
async function ensureRecord(db: Db): Promise<void> {
  await db.execute(sql`create schema if not exists drizzle`);
  await db.execute(sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`);
}

/** Runs one migration's statements, skipping those whose work is already done, and records it unless the record has it. */
async function applyAgain(db: Db, migration: Migration, recorded: boolean): Promise<void> {
  await db.transaction(async (tx) => {
    for (const statement of migration.statements) {
      if (!withoutComments(statement)) continue;
      await tx.execute(sql`savepoint statement`);
      try {
        await tx.execute(sql.raw(statement));
        await tx.execute(sql`release savepoint statement`);
      } catch (error) {
        if (!tolerated(statement, sqlState(error))) throw error;
        await tx.execute(sql`rollback to savepoint statement`);
      }
    }
    if (!recorded) {
      await tx.execute(sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.when})`);
    }
  });
  console.log(recorded ? `[opero] Applied ${migration.tag} again: the database did not have all of it.` : `[opero] Applied ${migration.tag}.`);
}

/* ------------------------------------------------------------------------ */
/* A database whose tables were created without migrations                  */
/* ------------------------------------------------------------------------ */

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

  const [first] = readMigrations();
  if (!first) return;
  const expected = snapshotTables(first.idx);
  const existing = await databaseTables(db);

  // An empty database: the first migration creates everything.
  if (![...expected.keys()].some((table) => existing.has(table))) return;

  const missing = missingFrom(expected, existing);
  if (missing.length) {
    const listed = missing.length > 10 ? `${missing.slice(0, 10).join(', ')}, and ${missing.length - 10} more` : missing.join(', ');
    throw new DatabaseMismatchError(
      `The database already has some of the site's tables but not all of them, so it was left unchanged. Missing: ${listed}. Point DATABASE_URL at an empty database, or have a developer reconcile this one.`,
    );
  }

  // The record, holding the row the first migration would have written.
  await ensureRecord(db);
  await db.execute(sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${first.hash}, ${first.when})`);
  console.log("[opero] The database already had the site's tables; recorded the first migration as applied.");
}
