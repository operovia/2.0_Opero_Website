import { readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { bootstrap } from '@/server/bootstrap';
import { changeContent } from '@/server/content-version';

/** True while the newest migration has no SQL yet, as when drizzle-kit has just made a custom one. */
function newestMigrationEmpty(folder: string): boolean {
  try {
    const journal = JSON.parse(readFileSync(path.join(folder, 'meta', '_journal.json'), 'utf8')) as { entries: { tag: string }[] };
    const newest = journal.entries.at(-1);
    if (!newest) return false;
    const sql = readFileSync(path.join(folder, `${newest.tag}.sql`), 'utf8');
    return sql.replace(/--.*$/gm, '').trim() === '';
  } catch {
    return false;
  }
}

/**
 * Development only: applies migrations that arrive while the dev server is
 * running, for example from a git pull, so the site keeps working without a
 * restart. A deploy restarts production servers, which apply them on start.
 * A migration with no SQL yet waits until its SQL is written, because once
 * applied it would never run again.
 */
export function watchForMigrations(): void {
  const folder = path.join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle');
  let timer: NodeJS.Timeout | undefined;
  const changed = (file: string | null) => {
    if (file !== '_journal.json' && !file?.endsWith('.sql')) return;
    // A pull writes several files; wait for it to settle.
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (newestMigrationEmpty(folder)) {
        console.log('[opero] A new migration has no SQL yet; it will be applied once its SQL is saved.');
        return;
      }
      console.log('[opero] Checking for new database migrations.');
      await bootstrap();
      // Content cached before the migration may be missing what it added.
      await changeContent(async () => {}).catch(() => {});
    }, 750);
  };
  try {
    watch(path.join(folder, 'meta'), (_event, file) => changed(file));
    watch(folder, (_event, file) => changed(file));
  } catch (error) {
    console.warn('[opero] Could not watch for new migrations; restart the dev server after pulling any.', error);
  }
}
