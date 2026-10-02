import { describe, expect, it } from 'vitest';
import { doorPrefill } from './prefill';

describe('the address a link fills in at the door', () => {
  it('takes one address, trimmed', () => {
    expect(doorPrefill('ideas@fifthwall.com')).toBe('ideas@fifthwall.com');
    expect(doorPrefill('  Ideas@FifthWall.com ')).toBe('Ideas@FifthWall.com');
  });

  it('fills in nothing for anything that is not one address', () => {
    expect(doorPrefill(undefined)).toBe('');
    expect(doorPrefill('')).toBe('');
    expect(doorPrefill(['a@b.co', 'c@d.co'])).toBe('');
    expect(doorPrefill('not an address')).toBe('');
    expect(doorPrefill('<script>alert(1)</script>@x.co')).toBe('');
    expect(doorPrefill(`${'a'.repeat(250)}@b.co`)).toBe('');
  });
});
