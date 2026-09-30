/**
 * What a server instance knows about its own health: how its last attempt
 * to prepare the database went, and the last errors its pages hit. It lives
 * on globalThis so the instrumentation hook, bundled on its own, and the
 * admin pages read the same record. Each instance keeps its own; nothing
 * here is stored.
 */

export type BootstrapReport = {
  at: Date;
  ok: boolean;
  message: string | null;
  /** Migrations that run applied because the database did not have them, though its record may have said otherwise. */
  repaired: string[];
};
export type RequestError = { at: Date; path: string; message: string; digest: string | null };

type Health = { bootstrap: BootstrapReport | null; running: Promise<void> | null; errors: RequestError[] };

const MAX_ERRORS = 10;

const store = globalThis as unknown as { operoHealth?: Health };
const health: Health = (store.operoHealth ??= { bootstrap: null, running: null, errors: [] });

export function lastBootstrap(): BootstrapReport | null {
  return health.bootstrap;
}

export function reportBootstrap(ok: boolean, message: string | null, repaired: string[] = []): void {
  health.bootstrap = { at: new Date(), ok, message, repaired };
}

/** Runs one preparation at a time per process: a retry while one is in flight joins it. */
export function shareBootstrap(run: () => Promise<void>): Promise<void> {
  if (!health.running) {
    health.running = run().finally(() => {
      health.running = null;
    });
  }
  return health.running;
}

export function recordRequestError(error: RequestError): void {
  health.errors.unshift(error);
  if (health.errors.length > MAX_ERRORS) health.errors.length = MAX_ERRORS;
}

/** The last errors this server's pages and actions hit, newest first. */
export function recentRequestErrors(): RequestError[] {
  return [...health.errors];
}

/** A short description of a thrown value, for the admin. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    // A failed query is reported with the whole statement; the database's own message is the useful part.
    if (error.cause instanceof Error && error.message.startsWith('Failed query:')) return error.cause.message;
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : '';
    return `${error.message}${cause}`;
  }
  return String(error);
}
