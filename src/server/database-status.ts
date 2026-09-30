import { db } from '@/db/client';
import { planMigrations } from '@/db/migrate';
import { describeError, lastBootstrap, type BootstrapReport } from '@/server/health';

export type DatabaseStatus = {
  /** Migrations the database still needs, oldest first: unrecorded, or recorded but not all there. */
  pending: string[];
  /** Tables and columns the newest migration expects that the database lacks. */
  missing: string[];
  /** Why the migrations could not be checked, when the database did not answer. */
  unreachable: string | null;
  /** How this server's last attempt to prepare the database went. */
  report: BootstrapReport | null;
};

/** Whether the database is behind the code this server runs, and why, for the admin. */
export async function databaseStatus(): Promise<DatabaseStatus> {
  const report = lastBootstrap();
  try {
    const plan = await planMigrations(db);
    return { pending: plan.todo.map((migration) => migration.tag), missing: plan.missing, unreachable: null, report };
  } catch (error) {
    return { pending: [], missing: [], unreachable: describeError(error), report };
  }
}

export function databaseNeedsAttention(status: DatabaseStatus): boolean {
  return status.pending.length > 0 || status.unreachable !== null || status.report?.ok === false;
}
