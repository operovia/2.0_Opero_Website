import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** A URL-safe random token from 32 random bytes (256 bits). */
export function randomToken(bytes = 32): string {
  return randomBytes(Math.max(bytes, 32)).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
