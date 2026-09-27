import { sql } from 'drizzle-orm';
import { db, type Tx } from '@workspace/db';
import { siteState } from '@workspace/db';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets in-process caches drop their copy as soon as this instance changes public content. */
export function onContentChange(listener: Listener): void {
  listeners.add(listener);
}

/**
 * Runs a change to anything the public site shows (content, scenes,
 * settings) in a transaction that also bumps the content version. Other
 * server instances notice the new version on their next check; this
 * instance is told right after the commit.
 */
export async function changeContent<T>(change: (tx: Tx) => Promise<T>): Promise<T> {
  const result = await db.transaction(async (tx) => {
    const value = await change(tx);
    await tx.update(siteState).set({ contentVersion: sql`${siteState.contentVersion} + 1` });
    return value;
  });
  for (const listener of listeners) listener();
  return result;
}
