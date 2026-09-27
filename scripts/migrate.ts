/**
 * Applies pending database migrations and first-run data by hand. The server
 * already does this on every start; use this after pulling new migrations
 * when you want to prepare the database before starting.
 *
 *   npm run db:migrate
 */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function main() {
  const { bootstrap } = await import('../src/server/bootstrap');
  const { pool } = await import('../src/db/client');
  await bootstrap();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
