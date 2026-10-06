import { describe, expect, it } from 'vitest';
import { pages } from '@/content/registry';
import { capTableCopy, capTableView, percent, snapAmount, type CapTableConfig } from './cap-table-math';
import golden from './cap-table-golden.json';
import roundGolden from './cap-table-golden-round.json';

/* The cap table handoff's inputs (its math spec), and the golden values it checked at every slider position (its Appendix A). */
const config: CapTableConfig = {
  holders: [
    { holder: 'Founder', class: 'Common', shares: 7_000_000 },
    { holder: 'Flagship operator', class: 'Common', shares: 1_500_000 },
    { holder: 'Employee pool', class: 'Reserved, unissued', shares: 1_500_000 },
  ],
  raise: 750_000,
  cap: 10_000_000,
  minimum: 50_000,
  step: 25_000,
  start: 300_000,
};

const staticAfter = [golden.static['cap-after-pct-founder'], golden.static['cap-after-pct-flagship'], golden.static['cap-after-pct-pool']];

describe('the golden values, at every slider position', () => {
  it('has all 29 positions, $50,000 to $750,000 in $25,000 steps', () => {
    expect(golden.steps.map((step) => step.investment)).toEqual(Array.from({ length: 29 }, (_, i) => 50_000 + i * 25_000));
  });

  for (const step of golden.steps) {
    it(`at ${step.you_amount}`, () => {
      const view = capTableView(config, step.investment);
      expect(view.amount).toBe(step.investment);
      expect(view.youAmount).toBe(step.you_amount);
      expect(view.shareOfRound).toBe(step.share_of_round);
      expect(view.you.after).toBe(step.you_pct);
      expect(view.you.shares).toBe(step.you_shares);
      expect(view.others.after).toBe(step.others_pct);
      expect(view.others.shares).toBe(step.others_shares);
      expect(view.othersAmount).toBe(step.others_amount);
      expect(view.totalAfter.shares).toBe(step.total_after_shares);
      // The holders already on the table read the same at every position.
      expect(view.existing.map((row) => row.after)).toEqual(staticAfter);
      expect(view.existing.map((row) => row.shares)).toEqual(['7,000,000', '1,500,000', '1,500,000']);
    });
  }

  it('totals 10,810,810 shares after the round at every position, never the rounded 10,810,811', () => {
    for (const step of golden.steps) expect(capTableView(config, step.investment).totalAfter.shares).toBe('10,810,810');
  });
});

describe('the amount', () => {
  const atMinimum = capTableView(config, 50_000);

  it('takes anything below the minimum as the minimum', () => {
    for (const amount of [0, 25_000, 49_999, -10_000]) expect(capTableView(config, amount)).toEqual(atMinimum);
    expect(snapAmount(config, 25_000)).toBe(50_000);
  });

  it('takes anything unreadable as the minimum, and nothing above the round', () => {
    expect(capTableView(config, Number.NaN)).toEqual(atMinimum);
    expect(capTableView(config, Number.POSITIVE_INFINITY)).toEqual(atMinimum);
    expect(capTableView(config, 2_000_000)).toEqual(capTableView(config, 750_000));
  });

  it('leaves nothing for other investors once the reader takes the whole round', () => {
    const view = capTableView(config, 750_000);
    expect(view.othersAmount).toBeNull();
    expect(view.remaining).toBe('$0');
    expect(view.others).toEqual({ after: '0.00%', shares: '0', bar: 0 });
  });
});

describe('the rest of the table', () => {
  const view = capTableView(config, 300_000);

  it('shows today at one decimal, with the round at 0.0%', () => {
    expect(view.existing.map((row) => row.today)).toEqual(['70.0%', '15.0%', '15.0%']);
    expect(view.todayNone).toBe('0.0%');
    expect(view.totalToday).toEqual({ percent: '100.0%', shares: '10,000,000' });
    expect(view.totalAfter).toEqual({ percent: '100.00%', shares: '10,810,810' });
  });

  it('describes the round: $750,000, converting to 7.5% of the company', () => {
    expect(view.roundAmount).toBe('$750,000');
    expect(view.roundPercent).toBe('7.5%');
    expect(view.remaining).toBe('$450,000');
  });

  it('draws every bar at the exact ownership, on one scale', () => {
    expect(view.existing.map((row) => row.bar)).toEqual([64.75, 13.875, 13.875]);
    expect(view.you.bar).toBe(3);
    expect(view.others.bar).toBe(4.5);
    expect(view.minimumAt).toBeCloseTo(6.667, 3);
    expect(view.split).toBe(40);
  });

  it('never shows the price per share, or the rounded total, at any position', () => {
    for (const step of golden.steps) {
      const shown = JSON.stringify(capTableView(config, step.investment));
      expect(shown).not.toContain('0.925');
      expect(shown).not.toContain('10,810,811');
    }
  });

  it('keeps the holders in order, with their names and classes', () => {
    expect(view.existing.map((row) => [row.holder, row.class])).toEqual([
      ['Founder', 'Common'],
      ['Flagship operator', 'Common'],
      ['Employee pool', 'Reserved, unissued'],
    ]);
  });

  it('refuses a round at or above the cap, or a table without shares', () => {
    expect(() => capTableView({ ...config, cap: 750_000 }, 300_000)).toThrow();
    expect(() => capTableView({ ...config, holders: [{ holder: 'Founder', class: 'Common', shares: 0 }] }, 300_000)).toThrow();
  });
});

describe('capTableCopy', () => {
  it("fills the cap table's copy, as the Copy Deck words it", () => {
    const seed = pages.investors.sections.round.seed;
    const view = capTableView(config, 300_000);
    expect(capTableCopy(seed.bandLine, view)).toBe('$750,000, converting to 7.5% of the company');
    expect(capTableCopy(seed.youShare, view)).toBe('40% of the round');
    expect(capTableCopy(seed.minimumLabel, view)).toBe('$50,000 minimum');
    expect(capTableCopy(seed.sliderValueText, view)).toBe('$300,000, 3.00% ownership after conversion');
    expect(capTableCopy(seed.youShare, capTableView(config, 50_000))).toBe('6.7% of the round');
  });

  it('leaves text without placeholders as it was', () => {
    expect(capTableCopy('Drag to model your investment', capTableView(config, 300_000))).toBe('Drag to model your investment');
  });
});

describe('percent', () => {
  it('rounds the exact fraction half up, where floating point would not', () => {
    // 1.005% is 1.00% to floating point (1.005 is stored as 1.00499...), and 1.01% exactly.
    expect((1.005).toFixed(2)).toBe('1.00');
    expect(percent(BigInt(1005), BigInt(100_000), 2)).toBe('1.01%');
    expect(percent(BigInt(1), BigInt(3), 1)).toBe('33.3%');
    expect(percent(BigInt(2), BigInt(3), 1)).toBe('66.7%');
    expect(percent(BigInt(1), BigInt(8), 0)).toBe('13%');
    expect(percent(BigInt(0), BigInt(5), 2)).toBe('0.00%');
  });
});

/*
 * The shipped round: $1,000,000, sized by the owner from the budget, with the handoff's other figures. Its golden values
 * (cap-table-golden-round.json) were worked out apart from this code, in exact fractions, by a calculation that reproduces the
 * handoff's own golden values above to the character.
 */
const round: CapTableConfig = { ...config, raise: 1_000_000 };
const roundStatic = [roundGolden.static['cap-after-pct-founder'], roundGolden.static['cap-after-pct-flagship'], roundGolden.static['cap-after-pct-pool']];

describe('the shipped round, at every slider position', () => {
  it('has all 39 positions, $50,000 to $1,000,000 in $25,000 steps', () => {
    expect(roundGolden.steps.map((step) => step.investment)).toEqual(Array.from({ length: 39 }, (_, i) => 50_000 + i * 25_000));
  });

  for (const step of roundGolden.steps) {
    it(`at ${step.you_amount}`, () => {
      const view = capTableView(round, step.investment);
      expect(view.youAmount).toBe(step.you_amount);
      expect(view.shareOfRound).toBe(step.share_of_round);
      expect(view.you.after).toBe(step.you_pct);
      expect(view.you.shares).toBe(step.you_shares);
      expect(view.others.after).toBe(step.others_pct);
      expect(view.others.shares).toBe(step.others_shares);
      expect(view.othersAmount).toBe(step.others_amount);
      expect(view.totalAfter.shares).toBe(step.total_after_shares);
      expect(view.existing.map((row) => row.after)).toEqual(roundStatic);
    });
  }

  it('totals the whole share counts, so the column always adds up: 11,111,110 or 11,111,111, as the counts round down', () => {
    const totals = new Set(roundGolden.steps.map((step) => capTableView(round, step.investment).totalAfter.shares));
    expect([...totals].sort()).toEqual(['11,111,110', '11,111,111']);
  });

  it('describes the round: $1,000,000, converting to 10.0% of the company', () => {
    const view = capTableView(round, 300_000);
    expect([view.roundAmount, view.roundPercent]).toEqual(['$1,000,000', '10.0%']);
  });
});

describe('the shipped figures', () => {
  it('are the round the site shows, so a fresh site matches its golden values', () => {
    const seed = pages.investors.sections.round.seed;
    expect({
      holders: seed.capTable,
      raise: seed.raise,
      cap: seed.cap,
      minimum: seed.minimum,
      step: seed.step,
      start: seed.start,
    }).toEqual(round);
  });
});
