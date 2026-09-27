
const hosts = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((h) => h.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);

/**
 * CSRF protection for route handlers that change data (Server Actions check
 * this themselves): the request must come from a page on this site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwarded || request.headers.get('host');
  const allowed = [
    ...hosts(process.env.SITE_URL),
    ...hosts(process.env.ALLOWED_ORIGINS),
    ...hosts(process.env.REPLIT_DOMAINS),
    ...hosts(process.env.REPLIT_DEV_DOMAIN),
  ];
  return originHost === host || allowed.includes(originHost);
}
