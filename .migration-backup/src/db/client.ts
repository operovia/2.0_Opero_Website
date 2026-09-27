import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * One connection pool per server process. The pool connects lazily, so
 * importing this module never touches the database (important at build time).
 * In development the pool is kept on globalThis to survive hot reloads.
 */

const globalForDb = globalThis as unknown as { operoPool?: Pool };

function createPool(): Pool {
  if (!process.env.DATABASE_URL && process.env.NEXT_PHASE !== 'phase-production-build') {
    console.error('[opero] DATABASE_URL is not set. Add it to your environment (see .env.example).');
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

export const pool = globalForDb.operoPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.operoPool = pool;

export const db = drizzle({ client: pool, schema });

export type Db = typeof db;
/** A database handle or an open transaction. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0] | Db;
