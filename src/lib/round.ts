/*
 * The round's arithmetic, for the Investor Hub's investment model and
 * capitalization table (src/components/site/investors/round.tsx). Pure
 * functions of the figures the admin stores, so the page and the tests
 * share one set of sums.
 *
 * A post-money SAFE gives a fixed percentage: ownership is the investment
 * divided by the cap, and it does not change if the round grows. The
 * round as a whole takes raise / cap of the company, and every holder
 * already on the table is diluted by that same factor.
 */

export type Bounds = { min: number; max: number; step: number };

export type Holder = { holder: string; class: string; shares: number };

export type CapRow = {
  holder: string;
  class: string;
  /** Share count today; zero for the round's new holders. */
  shares: number;
  /** Share of the company today, as a fraction of one. */
  today: number;
  /** Share of the company after the round converts, as a fraction of one. */
  after: number;
  /** Illustrative share count after the round, assuming the full round converts. */
  sharesAfter: number;
  /** Which row this is: an existing holder, the reader, or the rest of the round. */
  kind: 'existing' | 'you' | 'others';
};

/** The amount held within the slider's bounds and on its step, counted from the minimum. Anything unreadable becomes the minimum. */
export function clampAmount(amount: number, { min, max, step }: Bounds): number {
  if (!Number.isFinite(amount)) return min;
  const stepped = step > 0 ? min + Math.round((amount - min) / step) * step : amount;
  return Math.min(max, Math.max(min, stepped));
}

/** The investor's share of the round. */
export function shareOfRound(amount: number, raise: number): number {
  return raise > 0 ? amount / raise : 0;
}

/** The investor's ownership after the round converts: the investment divided by the post-money cap. */
export function ownership(amount: number, cap: number): number {
  return cap > 0 ? amount / cap : 0;
}

/** The share of the company the whole round takes. */
export function roundShare(raise: number, cap: number): number {
  return cap > 0 ? raise / cap : 0;
}

/** An existing holder's share after the round: every holder is diluted by the same factor. */
export function diluted(before: number, share: number): number {
  return before * (1 - share);
}

/** What is left of the round after this investment. */
export function allocationRemaining(raise: number, amount: number): number {
  return Math.max(0, raise - amount);
}

/**
 * Illustrative only: the shares the full round converts into, S, so that
 * S / (today + S) equals the round's share of the company.
 */
export function asConvertedShares(totalToday: number, share: number): number {
  return share < 1 ? (totalToday * share) / (1 - share) : 0;
}

/** Illustrative only: the price per share the full round converts at, cap / (today + S). */
export function pricePerShare(cap: number, totalToday: number, safeShares: number): number {
  const total = totalToday + safeShares;
  return total > 0 ? cap / total : 0;
}

export type RoundInput = {
  amount: number;
  raise: number;
  cap: number;
  holders: readonly Holder[];
  youLabel: string;
  othersLabel: string;
};

export type RoundModel = {
  shareOfRound: number;
  ownership: number;
  roundShare: number;
  remaining: number;
  /** The existing holders, then the reader, then the rest of the round. */
  rows: CapRow[];
  totalToday: number;
  /** Illustrative: the shares the full round converts into, and the price per share. */
  safeShares: number;
  price: number;
};

/** Everything the model and the table show, from one (already clamped) amount. */
export function roundModel({ amount, raise, cap, holders, youLabel, othersLabel }: RoundInput): RoundModel {
  const share = roundShare(raise, cap);
  const mine = ownership(amount, cap);
  const others = Math.max(0, share - mine);
  const totalToday = holders.reduce((sum, holder) => sum + holder.shares, 0);
  const safeShares = asConvertedShares(totalToday, share);
  const yourShares = safeShares * shareOfRound(amount, raise);

  const rows: CapRow[] = holders.map((holder) => {
    const today = totalToday > 0 ? holder.shares / totalToday : 0;
    return {
      holder: holder.holder,
      class: holder.class,
      shares: holder.shares,
      today,
      after: diluted(today, share),
      sharesAfter: holder.shares,
      kind: 'existing',
    };
  });
  rows.push({ holder: youLabel, class: '', shares: 0, today: 0, after: mine, sharesAfter: yourShares, kind: 'you' });
  rows.push({ holder: othersLabel, class: '', shares: 0, today: 0, after: others, sharesAfter: Math.max(0, safeShares - yourShares), kind: 'others' });

  return {
    shareOfRound: shareOfRound(amount, raise),
    ownership: mine,
    roundShare: share,
    remaining: allocationRemaining(raise, amount),
    rows,
    totalToday,
    safeShares,
    price: pricePerShare(cap, totalToday, safeShares),
  };
}

/* ------------------------------------------------------------------------ */
/* Formatting                                                               */
/* ------------------------------------------------------------------------ */

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const count = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Whole dollars with thousands separators: $50,000. */
export function formatMoney(amount: number): string {
  return dollars.format(Number.isFinite(amount) ? amount : 0);
}

/** A whole number with thousands separators, for share counts: 810,811. */
export function formatCount(value: number): string {
  return count.format(Number.isFinite(value) ? Math.round(value) : 0);
}

/** A fraction of one as a percentage: one decimal in the table (64.8%), two for the stats (0.50%). */
export function formatPercent(fraction: number, decimals: 1 | 2): string {
  const value = Number.isFinite(fraction) ? fraction * 100 : 0;
  return `${value.toFixed(decimals)}%`;
}

/** A price per share to the cent: $0.93. Illustrative figures only. */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(
    Number.isFinite(price) ? price : 0,
  );
}
