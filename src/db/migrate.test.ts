import { describe, expect, it } from 'vitest';
import { pendingTags } from './migrate';

const entries = [
  { tag: '0000_first', when: 100 },
  { tag: '0001_second', when: 200 },
  { tag: '0002_third', when: 300 },
];

describe('pendingTags', () => {
  it('lists every migration for a database without a journal', () => {
    expect(pendingTags(entries, null)).toEqual(['0000_first', '0001_second', '0002_third']);
  });

  it('lists only the migrations made after the newest applied one', () => {
    expect(pendingTags(entries, 200)).toEqual(['0002_third']);
  });

  it('lists nothing when the newest migration has run', () => {
    expect(pendingTags(entries, 300)).toEqual([]);
  });
});
