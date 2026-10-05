/**
 * What a server instance knows about its own health: how its last attempt
 * to prepare the database went, the last errors its pages hit, and how its
 * emails went (when one last went out, and the last that did not). It lives
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
/** An email the email service refused or could not be reached for: to whom, about what, and its answer. */
export type EmailFailure = { at: Date; to: string; subject: string; message: string };
export type EmailHealth = { lastSentAt: Date | null; failures: EmailFailure[] };

type Health = { bootstrap: BootstrapReport | null; running: Promise<void> | null; errors: RequestError[]; email?: EmailHealth };

const MAX_ERRORS = 10;
const MAX_EMAIL_FAILURES = 5;

const store = globalThis as unknown as { operoHealth?: Health };
const health: Health = (store.operoHealth ??= { bootstrap: null, running: null, errors: [] });
// Kept apart from the record above, which a running dev server may have made before email was tracked.
const email = (): EmailHealth => (health.email ??= { lastSentAt: null, failures: [] });

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

/** Notes that the email service took an email: the Site health card shows when one last went out. */
export function recordEmailSent(): void {
  email().lastSentAt = new Date();
}

/** Keeps an email that did not go out, for the Site health card. */
export function recordEmailFailure(failure: EmailFailure): void {
  const record = email();
  record.failures.unshift(failure);
  if (record.failures.length > MAX_EMAIL_FAILURES) record.failures.length = MAX_EMAIL_FAILURES;
}

/** When this server last sent an email, and the last that did not go out, newest first. */
export function emailHealth(): EmailHealth {
  const record = email();
  return { lastSentAt: record.lastSentAt, failures: [...record.failures] };
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
