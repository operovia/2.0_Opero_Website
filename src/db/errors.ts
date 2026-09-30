/**
 * The SQLSTATE code of a database error, looking through the errors that
 * wrap it (a failed query reports the statement and carries the database's
 * error as its cause), or null for anything else: a connection that failed,
 * a timeout.
 */
export function sqlState(error: unknown): string | null {
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return null;
}
