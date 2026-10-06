import { describe, expect, it } from 'vitest';
import { pages } from '@/content/registry';
import { fillRoundFigures, millions, unknownTokens } from './round-figures';

const figures = { raise: 750_000, cap: 10_000_000, minimum: 50_000 };

describe('millions', () => {
  it('says the cap the way a sentence does', () => {
    expect(millions(10_000_000)).toBe('$10 million');
    expect(millions(12_500_000)).toBe('$12.5 million');
    expect(millions(1_000_000)).toBe('$1 million');
    expect(millions(2_000_000_000)).toBe('$2,000 million');
  });

  it('never rounds: anything else reads in full', () => {
    expect(millions(9_999_999)).toBe('$9,999,999');
    expect(millions(10_250_000)).toBe('$10,250,000');
    expect(millions(750_000)).toBe('$750,000');
  });
});

describe('fillRoundFigures', () => {
  it('fills each token from the saved figures', () => {
    expect(fillRoundFigures('{round} at {cap}, {minimum} minimum, {cap in millions}', figures)).toBe('$750,000 at $10,000,000, $50,000 minimum, $10 million');
    expect(fillRoundFigures('{cap}', { ...figures, cap: 12_000_000 })).toBe('$12,000,000');
  });

  it('leaves text without tokens, and tokens it does not know, as they were', () => {
    expect(fillRoundFigures('180 days', figures)).toBe('180 days');
    expect(fillRoundFigures('{cpa} and {partner}', figures)).toBe('{cpa} and {partner}');
  });
});

describe('unknownTokens', () => {
  it("finds tokens that are neither a figure nor one of the site's own", () => {
    expect(unknownTokens('{round}, {cap}, {minimum}, {cap in millions}, {partner}, {Partners}, {email}')).toEqual([]);
    expect(unknownTokens('{cpa} and {round }')).toEqual(['{cpa}', '{round }']);
  });
});

describe('The Raise as shipped', () => {
  const seed = pages.investors.sections.round.seed;

  it('reads the saved figures, worded exactly as it was when they were typed', () => {
    expect(seed.terms.map((term) => fillRoundFigures(term.value, seed))).toEqual(['$1,000,000', '$10,000,000', '$50,000', '$250,000', '180 days']);
    expect(fillRoundFigures(seed.getsBody, seed)).toBe(
      'The SAFE converts to preferred stock at the next priced equity round, at the lower of the cap or the round price. The cap is what does the work: a $100,000 check today converts as if the company were worth no more than $10 million, regardless of the price later investors pay.',
    );
  });
});
