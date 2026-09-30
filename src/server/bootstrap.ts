import { db, pool } from '@/db/client';
import { DatabaseMismatchError, runMigrations } from '@/db/migrate';
import { sqlState } from '@/db/errors';
import { describeError, reportBootstrap, shareBootstrap } from '@/server/health';
import { seed } from '@/server/seed';

/** Arbitrary constant identifying this app's startup lock in Postgres. */
const BOOTSTRAP_LOCK = 7_263_109_411;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Whether an error looks like a database that is not ready yet (no
 * connection, or Postgres still starting or short of resources) rather
 * than one that will fail the same way again, like a migration that
 * cannot run against what is there.
 */
function worthRetrying(error: unknown): boolean {
  const code = sqlState(error);
  return code === null || ['08', '40', '53', '57'].includes(code.slice(0, 2));
}

/**
 * Runs on every server start: applies pending migrations and seeds first-run
 * data. An advisory lock keeps several instances from doing it at once.
 * Retries cover databases that sleep when idle and take a moment to wake.
 * How it went is kept for the admin (src/server/health.ts), where it can be
 * run again after a failure; it applies only what is still missing.
 */
export function bootstrap(): Promise<void> {
  return shareBootstrap(prepare);
}

async function prepare(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const message = 'DATABASE_URL is not set, so the database was not prepared. See .env.example.';
    console.error(`[opero] ${message}`);
    reportBootstrap(false, message);
    return;
  }

  for (let attempt = 1; ; attempt++) {
    let repaired: string[] = [];
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT pg_advisory_lock($1)', [BOOTSTRAP_LOCK]);
        ({ repaired } = await runMigrations(db));
        await seed(db);
      } finally {
        await client.query('SELECT pg_advisory_unlock($1)', [BOOTSTRAP_LOCK]).catch(() => {});
        client.release();
      }
      console.log('[opero] Database is ready.');
      reportBootstrap(true, null, repaired);
      return;
    } catch (error) {
      if (error instanceof DatabaseMismatchError) {
        console.error(`[opero] ${error.message}`);
        reportBootstrap(false, error.message);
        return;
      }
      if (attempt >= 4 || !worthRetrying(error)) {
        console.error('[opero] Could not prepare the database:', error);
        reportBootstrap(false, `Could not prepare the database: ${describeError(error)}`);
        return;
      }
      console.warn(`[opero] Database not ready (attempt ${attempt}), retrying.`);
      await sleep(1000 * 2 ** attempt);
    }
  }
}
