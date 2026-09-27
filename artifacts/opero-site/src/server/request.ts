import { headers } from 'next/headers';

/** The caller's IP as reported by the proxy in front of the app, or '' if unknown. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return h.get('x-real-ip')?.trim() ?? '';
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get('user-agent') ?? '').slice(0, 300);
}

/** True when the current request reached us over HTTPS (directly or via a proxy). */
export async function isHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) return proto === 'https';
  return (process.env.SITE_URL ?? '').startsWith('https://');
}
