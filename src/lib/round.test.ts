import { describe, expect, it } from 'vitest';
import {
  allocationRemaining,
  asConvertedShares,
  clampAmount,
  diluted,
  formatCount,
  formatMoney,
  formatPercent,
  formatPrice,
  ownership,
  pricePerShare,
  roundModel,
  roundShare,
  shareOfRound,
} from './round';

/* The round's own figures: from the signed documents and the owner (see the Investor Hub's round section). */
const bounds = { min: 50_000, max: 750_000, step: 25_000 };
const raise = 750_000;
const cap = 10_000_000;
const holders = [
  { holder: 'Joseph Mifsud', class: 'Common, founder', shares: 7_000_000 },
  { holder: 'Oxford Companies', class: 'Common', shares: 1_500_000 },
  { holder: 'Equity incentive plan', class: 'Reserved, unissued', shares: 1_500_000 },
];
const model = (amount: number) => roundModel({ amount, raise, cap, holders, youLabel: 'You', othersLabel: 'Other pre-seed investors' });

describe('clampAmount', () => {
  it('holds the amount within the bounds', () => {
    expect(clampAmount(10_000, bounds)).toBe(50_000);
    expect(clampAmount(2_000_000, bounds)).toBe(750_000);
    expect(clampAmount(50_000, bounds)).toBe(50_000);
    expect(clampAmount(750_000, bounds)).toBe(750_000);
  });

  it('snaps to the step, counted from the minimum', () => {
    expect(clampAmount(60_000, bounds)).toBe(50_000);
    expect(clampAmount(63_000, bounds)).toBe(75_000);
    expect(clampAmount(100_000, bounds)).toBe(100_000);
    expect(clampAmount(101, { min: 1, max: 1000, step: 25 })).toBe(101);
  });

  it('treats anything unreadable as the minimum', () => {
    expect(clampAmount(Number.NaN, bounds)).toBe(50_000);
    expect(clampAmount(Number.POSITIVE_INFINITY, bounds)).toBe(50_000);
  });
});

describe('the sums', () => {
  it('$50,000 is 0.50% ownership and 6.67% of the round', () => {
    expect(ownership(50_000, cap)).toBeCloseTo(0.005, 10);
    expect(formatPercent(ownership(50_000, cap), 2)).toBe('0.50%');
    expect(formatPercent(shareOfRound(50_000, raise), 2)).toBe('6.67%');
  });

  it('the full round is 7.5% of the company', () => {
    expect(roundShare(raise, cap)).toBeCloseTo(0.075, 10);
    expect(formatPercent(roundShare(raise, cap), 1)).toBe('7.5%');
    expect(ownership(750_000, cap)).toBeCloseTo(0.075, 10);
  });

  it('dilutes every existing holder by the same factor: Mifsud 70.0% becomes 64.75%', () => {
    expect(diluted(0.7, 0.075)).toBeCloseTo(0.6475, 10);
    const [mifsud, oxford, plan] = model(50_000).rows;
    expect(mifsud!.today).toBeCloseTo(0.7, 10);
    expect(mifsud!.after).toBeCloseTo(0.6475, 10);
    expect(oxford!.after).toBeCloseTo(0.15 * 0.925, 10);
    expect(plan!.after).toBeCloseTo(0.15 * 0.925, 10);
  });

  it('splits the round between the reader and the rest, and the table sums to one', () => {
    const m = model(250_000);
    const you = m.rows.find((r) => r.kind === 'you')!;
    const others = m.rows.find((r) => r.kind === 'others')!;
    expect(you.after).toBeCloseTo(0.025, 10);
    expect(others.after).toBeCloseTo(0.05, 10);
    expect(m.rows.reduce((sum, r) => sum + r.after, 0)).toBeCloseTo(1, 10);
    expect(m.rows.reduce((sum, r) => sum + r.today, 0)).toBeCloseTo(1, 10);
  });

  it('ownership does not depend on the raise', () => {
    expect(ownership(100_000, cap)).toBe(roundModel({ amount: 100_000, raise: 1_600_000, cap, holders, youLabel: 'You', othersLabel: 'Others' }).ownership);
  });

  it('counts the allocation remaining', () => {
    expect(allocationRemaining(raise, 50_000)).toBe(700_000);
    expect(allocationRemaining(raise, 750_000)).toBe(0);
    expect(model(750_000).remaining).toBe(0);
  });

  it('converts the full round into 810,811 shares at about $0.925', () => {
    const shares = asConvertedShares(10_000_000, 0.075);
    expect(Math.round(shares)).toBe(810_811);
    expect(pricePerShare(cap, 10_000_000, shares)).toBeCloseTo(0.925, 3);
    const m = model(750_000);
    expect(formatCount(m.safeShares)).toBe('810,811');
    expect(m.price).toBeCloseTo(0.925, 3);
    // The whole round, taken by one reader, is every SAFE share.
    expect(m.rows.find((r) => r.kind === 'you')!.sharesAfter).toBeCloseTo(shares, 6);
    expect(m.rows.find((r) => r.kind === 'others')!.sharesAfter).toBe(0);
    // And the shares agree with the percentages.
    const total = m.totalToday + m.safeShares;
    for (const row of m.rows) expect(row.sharesAfter / total).toBeCloseTo(row.after, 10);
  });

  it('gives the reader their share of the converted shares', () => {
    const m = model(50_000);
    expect(m.rows.find((r) => r.kind === 'you')!.sharesAfter).toBeCloseTo(m.safeShares / 15, 6);
  });
});

describe('formatting', () => {
  it('money has no decimals and thousands separators', () => {
    expect(formatMoney(50_000)).toBe('$50,000');
    expect(formatMoney(10_000_000)).toBe('$10,000,000');
    expect(formatMoney(1234.56)).toBe('$1,235');
  });

  it('percentages take one decimal for the table and two for the stats', () => {
    expect(formatPercent(0.6475, 1)).toBe('64.8%');
    expect(formatPercent(0.7, 1)).toBe('70.0%');
    expect(formatPercent(0.075, 2)).toBe('7.50%');
    expect(formatPercent(0.0666666, 2)).toBe('6.67%');
  });

  it('counts and prices', () => {
    expect(formatCount(810_810.81)).toBe('810,811');
    expect(formatPrice(0.925)).toBe('$0.925');
    expect(formatPrice(1)).toBe('$1.00');
  });
});
