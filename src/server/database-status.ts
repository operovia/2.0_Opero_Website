import { db } from '@/db/client';
import { pendingMigrations } from '@/db/migrate';
import { describeError, lastBootstrap, type BootstrapReport } from '@/server/health';

export type DatabaseStatus = {
  /** Migrations the database has not run yet, oldest first. */
  pending: string[];
  /** Why the migrations could not be checked, when the database did not answer. */
  unreachable: string | null;
  /** How this server's last attempt to prepare the database went. */
  report: BootstrapReport | null;
};

/** Whether the database is behind the code this server runs, and why, for the admin. */
export async function databaseStatus(): Promise<DatabaseStatus> {
  const report = lastBootstrap();
  try {
    return { pending: await pendingMigrations(db), unreachable: null, report };
  } catch (error) {
    return { pending: [], unreachable: describeError(error), report };
  }
}

export function databaseNeedsAttention(status: DatabaseStatus): boolean {
  return status.pending.length > 0 || status.unreachable !== null || status.report?.ok === false;
}
