import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteUrl } from './env';

/** Sets exactly these variables for siteUrl, clearing the others it reads. */
function env(vars: Partial<Record<'NODE_ENV' | 'SITE_URL' | 'REPLIT_DOMAINS' | 'REPLIT_DEV_DOMAIN' | 'PORT', string>>) {
  for (const name of ['SITE_URL', 'REPLIT_DOMAINS', 'REPLIT_DEV_DOMAIN', 'PORT'] as const) vi.stubEnv(name, vars[name] ?? '');
  vi.stubEnv('NODE_ENV', vars.NODE_ENV ?? 'development');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteUrl', () => {
  it('is SITE_URL on the published app, without a trailing slash', () => {
    env({ NODE_ENV: 'production', SITE_URL: 'https://operovia.com/', REPLIT_DOMAINS: 'operowebsite.replit.app' });
    expect(siteUrl()).toBe('https://operovia.com');
  });

  it("is the app's Replit address on the published app when SITE_URL is not set", () => {
    env({ NODE_ENV: 'production', REPLIT_DOMAINS: 'operowebsite.replit.app,other.replit.app' });
    expect(siteUrl()).toBe('https://operowebsite.replit.app');
  });

  it("is the dev URL on Replit's development server, even with SITE_URL in the shared Secrets", () => {
    env({ SITE_URL: 'https://operovia.com', REPLIT_DOMAINS: 'abc-00-xyz.riker.replit.dev', REPLIT_DEV_DOMAIN: 'abc-00-xyz.riker.replit.dev' });
    expect(siteUrl()).toBe('https://abc-00-xyz.riker.replit.dev');
  });

  it('never takes the dev URL on the published app', () => {
    env({ NODE_ENV: 'production', SITE_URL: 'https://operovia.com', REPLIT_DEV_DOMAIN: 'abc-00-xyz.riker.replit.dev' });
    expect(siteUrl()).toBe('https://operovia.com');
  });

  it('is SITE_URL in development away from Replit', () => {
    env({ SITE_URL: 'http://localhost:3100' });
    expect(siteUrl()).toBe('http://localhost:3100');
  });

  it('falls back to localhost on the port', () => {
    env({ PORT: '3200' });
    expect(siteUrl()).toBe('http://localhost:3200');
  });
});
