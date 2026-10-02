import { describe, expect, it } from 'vitest';
import { GREETING_MAX } from '@/content/constants';
import { fillName, normalizeGreeting } from './greeting';

describe('normalizeGreeting', () => {
  it('keeps a name as typed, trimmed', () => {
    expect(normalizeGreeting('  Fifth Wall ')).toBe('Fifth Wall');
  });

  it('makes one line with single spaces', () => {
    expect(normalizeGreeting('Fifth\n  Wall\tteam')).toBe('Fifth Wall team');
  });

  it('drops asterisks, which would turn the emphasis of the headline around it', () => {
    expect(normalizeGreeting('*Fifth* Wall')).toBe('Fifth Wall');
  });

  it('caps the length, without a trailing space', () => {
    const long = normalizeGreeting(`${'a'.repeat(GREETING_MAX - 1)} bcd`);
    expect(long.length).toBeLessThanOrEqual(GREETING_MAX);
    expect(long.endsWith(' ')).toBe(false);
  });

  it('turns nothing but space into no name', () => {
    expect(normalizeGreeting('   ')).toBe('');
  });
});

describe('fillName', () => {
  it('puts the name where {name} is, every time', () => {
    expect(fillName('Welcome, *{name}*.', 'Fifth Wall')).toBe('Welcome, *Fifth Wall*.');
    expect(fillName('{name}, {name}', 'Ann')).toBe('Ann, Ann');
  });

  it('leaves copy without {name} alone', () => {
    expect(fillName('Welcome.', 'Fifth Wall')).toBe('Welcome.');
  });
});
