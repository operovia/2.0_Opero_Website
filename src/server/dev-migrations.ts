import { watch } from 'node:fs';
import path from 'node:path';
import { bootstrap } from '@/server/bootstrap';
import { changeContent } from '@/server/content-version';

/**
 * Development only: applies migrations that arrive while the dev server is
 * running, for example from a git pull, so the site keeps working without a
 * restart. A deploy restarts production servers, which apply them on start.
 */
export function watchForMigrations(): void {
  const folder = path.join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle', 'meta');
  let timer: NodeJS.Timeout | undefined;
  try {
    watch(folder, (_event, file) => {
      if (file !== '_journal.json') return;
      // A pull writes several files; wait for it to settle.
      clearTimeout(timer);
      timer = setTimeout(async () => {
        console.log('[opero] New database migrations arrived; applying them.');
        await bootstrap();
        // Content cached before the migration may be missing what it added.
        await changeContent(async () => {}).catch(() => {});
      }, 750);
    });
  } catch (error) {
    console.warn('[opero] Could not watch for new migrations; restart the dev server after pulling any.', error);
  }
}
