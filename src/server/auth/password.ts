import { hash, verify, type Options } from '@node-rs/argon2';
import { z } from 'zod';

/**
 * Argon2id with the OWASP-recommended baseline (19 MiB memory, 2 passes).
 * `algorithm: 2` is Argon2id; the library's enum is a const enum that
 * isolated modules cannot import.
 */
const options: Options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export const MIN_PASSWORD_LENGTH = 12;

/** Rules for any new password an admin chooses. */
export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(200, 'Use at most 200 characters.');

export function hashPassword(password: string): Promise<string> {
  return hash(password, options);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** A hash of a random value, verified against when an email is unknown so timing does not reveal it. */
let dummyHash: Promise<string> | undefined;
export function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(`unused-${Math.random()}`);
  return dummyHash;
}
