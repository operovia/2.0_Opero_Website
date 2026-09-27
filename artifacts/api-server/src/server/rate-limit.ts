import { lt, sql } from 'drizzle-orm';
import { db } from '@workspace/db';
import { rateLimits } from '@workspace/db';

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * Fixed-window rate limit stored in Postgres, so it holds across server
 * instances. Counts one hit for `key`; allows up to `limit` per window.
 */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const window = sql`make_interval(secs => ${windowSeconds})`;
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: sql`now() + ${window}` })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN now() + ${window} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  const { count, resetAt } = rows[0]!;
  if (Math.random() < 0.02) void db.delete(rateLimits).where(lt(rateLimits.resetAt, sql`now()`)).catch(() => {});
  return {
    ok: count <= limit,
    retryAfterSeconds: Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  };
}

export async function clear(key: string): Promise<void> {
  await db.delete(rateLimits).where(sql`${rateLimits.key} = ${key}`);
}

/** "3 minutes" style wording for a retry delay. */
export function retryWording(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? 'a minute' : `${minutes} minutes`;
}
