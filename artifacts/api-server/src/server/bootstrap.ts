import { db } from '@workspace/db';
import { logger } from '@/lib/logger';
import { seed } from '@/server/seed';

/** Adds first-run defaults without overwriting records already managed in Postgres. */
export async function bootstrap(): Promise<void> {
  await seed(db);
  logger.info('Opero backend seed checks complete');
}