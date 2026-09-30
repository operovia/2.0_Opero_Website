/**
 * Runs once when a server instance starts, before it handles requests:
 * prepares the database (migrations and first-run data). Skipped during
 * `next build`, which never touches the database. The dev server also
 * applies migrations that arrive while it runs, such as from a git pull.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { bootstrap } = await import('./server/bootstrap');
  await bootstrap();
  if (process.env.NODE_ENV === 'development') {
    const { watchForMigrations } = await import('./server/dev-migrations');
    watchForMigrations();
  }
}

/** Keeps the last errors this server's pages and actions hit, for the admin's Site health card. */
export async function onRequestError(error: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { describeError, recordRequestError } = await import('./server/health');
  recordRequestError({
    at: new Date(),
    // Without the query string, which can carry a personal survey link's token.
    path: request.path.split('?')[0] ?? request.path,
    message: describeError(error),
    digest: typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : null,
  });
}
