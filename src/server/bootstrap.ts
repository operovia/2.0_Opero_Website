import { db, pool } from '@/db/client';
import { DatabaseMismatchError, runMigrations } from '@/db/migrate';
import { seed } from '@/server/seed';

/** Arbitrary constant identifying this app's startup lock in Postgres. */
const BOOTSTRAP_LOCK = 7_263_109_411;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs on every server start: applies pending migrations and seeds first-run
 * data. An advisory lock keeps several instances from doing it at once.
 * Retries cover databases that sleep when idle and take a moment to wake.
 */
export async function bootstrap(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[opero] DATABASE_URL is not set, so the database was not prepared. See .env.example.');
    return;
  }

  for (let attempt = 1; ; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT pg_advisory_lock($1)', [BOOTSTRAP_LOCK]);
        await runMigrations(db);
        await seed(db);
      } finally {
        await client.query('SELECT pg_advisory_unlock($1)', [BOOTSTRAP_LOCK]).catch(() => {});
        client.release();
      }
      console.log('[opero] Database is ready.');
      return;
    } catch (error) {
      if (error instanceof DatabaseMismatchError) {
        console.error(`[opero] ${error.message}`);
        return;
      }
      if (attempt >= 4) {
        console.error('[opero] Could not prepare the database:', error);
        return;
      }
      console.warn(`[opero] Database not ready (attempt ${attempt}), retrying.`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}
