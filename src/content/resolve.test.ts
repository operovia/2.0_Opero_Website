import { describe, expect, it } from 'vitest';
import { pages } from './registry';
import { resolveStored } from './resolve';

const round = pages.investors.sections.round;

describe('resolveStored', () => {
  it('shows stored content that passes as it is', () => {
    const { data, problems } = resolveStored(round, { ...round.seed, raise: 800_000 });
    expect(problems).toEqual([]);
    expect((data as typeof round.seed).raise).toBe(800_000);
  });

  it("keeps the owner's figures when they disagree, never the shipped ones, and says what is wrong", () => {
    const { data, problems } = resolveStored(round, { ...round.seed, raise: 10_000_000 });
    expect((data as typeof round.seed).raise).toBe(10_000_000);
    expect(problems).toEqual([
      { field: 'raise', label: 'The round, in dollars', message: 'The round must be smaller than the valuation cap.', kind: 'check' },
    ]);
  });

  it('says when a figure cannot be read at all', () => {
    const { problems } = resolveStored(round, { ...round.seed, cap: 'ten million' });
    expect(problems.map((problem) => [problem.field, problem.kind])).toEqual([['cap', 'fields']]);
    expect(problems[0]!.label).toBe('Valuation cap, in dollars');
  });

  it('falls back to the shipped copy in sections that do not withhold, as before', () => {
    const hero = pages.home.sections.hero;
    const { data, problems } = resolveStored(hero, { ...hero.seed, headline: 42 });
    expect(problems.length).toBeGreaterThan(0);
    expect(data).toEqual(hero.seed);
  });
});
