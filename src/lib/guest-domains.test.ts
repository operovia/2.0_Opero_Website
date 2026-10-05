import { describe, expect, it } from 'vitest';
import { domainOf, isPublicEmailDomain, normalizeDomain } from './guest-domains';

describe('normalizeDomain', () => {
  it('takes the domain however the owner types it', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
    expect(normalizeDomain('@Example.com')).toBe('example.com');
    expect(normalizeDomain('  EXAMPLE.COM  ')).toBe('example.com');
    expect(normalizeDomain('jane.doe@example.com')).toBe('example.com');
    expect(normalizeDomain('example.com.')).toBe('example.com');
    expect(normalizeDomain('mail.example.co.uk')).toBe('mail.example.co.uk');
  });

  it('refuses what is not a domain name', () => {
    for (const input of [
      '',
      '   ',
      '@',
      'example',
      'example.',
      '.com',
      'free stuff.com',
      '-example.com',
      'example-.com',
      'example..com',
      'example.c',
      'example.123',
      'https://example.com',
    ]) {
      expect(normalizeDomain(input), input).toBeNull();
    }
  });
});

describe('domainOf', () => {
  it('is everything after the last @', () => {
    expect(domainOf('jane.doe@example.com')).toBe('example.com');
    expect(domainOf('"odd@name"@example.com')).toBe('example.com');
  });
});

describe('isPublicEmailDomain', () => {
  it('knows the services anyone can sign up for', () => {
    expect(isPublicEmailDomain('gmail.com')).toBe(true);
    expect(isPublicEmailDomain('outlook.com')).toBe(true);
    expect(isPublicEmailDomain('example.com')).toBe(false);
  });
});
