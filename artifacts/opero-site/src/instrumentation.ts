/**
 * Runs once when a server instance starts, before it handles requests:
 * prepares the database (migrations and first-run data). Skipped during
 * `next build`, which never touches the database.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { bootstrap } = await import('./server/bootstrap');
  await bootstrap();
}
