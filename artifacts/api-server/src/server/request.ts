import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';

type RequestContext = { req: Request; res: Response };
const context = new AsyncLocalStorage<RequestContext>();

export function bindRequestContext(req: Request, res: Response, next: NextFunction): void {
  context.run({ req, res }, next);
}

export function currentRequest(): RequestContext | undefined {
  return context.getStore();
}

/** The caller's IP as reported by the proxy in front of the app, or '' if unknown. */
export async function clientIp(): Promise<string> {
  const req = context.getStore()?.req;
  const forwarded = req?.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req?.get('x-real-ip')?.trim() ?? req?.ip ?? '';
}

export async function userAgent(): Promise<string> {
  return (context.getStore()?.req.get('user-agent') ?? '').slice(0, 300);
}

/** True when the current request reached us over HTTPS (directly or via a proxy). */
export async function isHttps(): Promise<boolean> {
  const req = context.getStore()?.req;
  const proto = req?.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto ? proto === 'https' : Boolean(req?.secure || (process.env.SITE_URL ?? '').startsWith('https://'));
}

export function readCookie(name: string): string | null {
  const header = context.getStore()?.req.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(value.join('=')); } catch { return null; }
    }
  }
  return null;
}

export function writeCookie(name: string, value: string, options: {
  httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; path?: string; maxAge?: number;
}): void {
  context.getStore()?.res.cookie(name, value, options);
}

export function clearCookie(name: string, options: { httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; path?: string }): void {
  context.getStore()?.res.clearCookie(name, options);
}