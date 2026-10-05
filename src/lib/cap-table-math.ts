/*
 * The cap table's arithmetic, for the Data Room's Cap Table tab
 * (src/components/site/investors/cap-table.tsx). One pure function of the
 * figures the admin keeps for the round (Content, Data Room, The round) and
 * the reader's investment, returning every figure the table shows, already
 * formatted. The reference is the cap table handoff's math spec and its
 * mockup (docs/reference/Cap_Table_Slider_Mockup.html).
 *
 * A post-money SAFE converts at a price of (cap - round) / shares today, so
 * an amount X converts into X * today / (cap - round) shares, rounded down
 * to whole shares. The price itself is never shown. A converting investor owns X / cap; a holder already on
 * the table owns shares * (cap - round) / (today * cap), which is their
 * shares over the company's exact, unrounded capitalization after the round.
 *
 * Every displayed figure is worked out in exact whole-number arithmetic
 * (BigInt), never floating point, which shows the wrong figure at some
 * positions: percentages are exact fractions rounded half up, share counts
 * are rounded down, and the total after the round is the sum of the whole
 * share counts. The project targets ES2017, which has no BigInt literals,
 * so the constants below are made with BigInt().
 */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);
const HUNDRED = BigInt(100);

/** The figures the admin keeps for the round: the one source every number on the table comes from. */
export type CapTableConfig = {
  /** The holders on the table today, in order, with whole share counts. */
  holders: readonly { holder: string; class: string; shares: number }[];
  /** The round, in dollars. */
  raise: number;
  /** The post-money valuation cap, in dollars. The table works with it but never shows it. */
  cap: number;
  /** The smallest investment, in dollars: anything below it is taken as it. */
  minimum: number;
  /** The slider's step, in dollars. */
  step: number;
  /** The investment the table opens on, in dollars. */
  start: number;
};

/** A holder already on the table: the same shares before and after, a smaller share of the company after. */
export type HolderRow = {
  holder: string;
  class: string;
  /** Share of the company today, one decimal: 70.0%. */
  today: string;
  /** Share of the company after the round converts, two decimals: 64.75%. */
  after: string;
  /** Whole shares, today and after: 7,000,000. */
  shares: string;
  /** The bar's width after the round, as a percentage of the full width: the exact ownership. */
  bar: number;
};

/** A holder the round brings in: the reader, or the rest of the round. */
export type NewHolderRow = {
  /** Share of the company after the round converts, two decimals: 3.00%. */
  after: string;
  /** Whole shares after the round, rounded down: 324,324. */
  shares: string;
  /** The bar's width, as a percentage of the full width: the exact ownership. */
  bar: number;
};

export type CapTableView = {
  /** The amount the figures are for: the investment, with anything below the minimum taken as the minimum and nothing above the round. */
  amount: number;
  /** The reader's investment: $300,000. */
  youAmount: string;
  /** The reader's share of the round: a whole number when exact (40%), otherwise one decimal (6.7%). */
  shareOfRound: string;
  /** What the round has left for other investors: $450,000, or $0. */
  remaining: string;
  /** The same, or null once the reader takes the whole round. */
  othersAmount: string | null;
  /** The whole round: $750,000. */
  roundAmount: string;
  /** The share of the company the whole round converts to, one decimal: 7.5%. */
  roundPercent: string;
  /** The smallest investment: $50,000. */
  minimumAmount: string;
  /** Today's share for the holders the round brings in: 0.0%. */
  todayNone: string;
  existing: HolderRow[];
  you: NewHolderRow;
  others: NewHolderRow;
  totalToday: { percent: string; shares: string };
  totalAfter: { percent: string; shares: string };
  /** Where the minimum sits along the round, as a percentage of its length. */
  minimumAt: number;
  /** Where the reader's part of the round ends, as a percentage of its length. */
  split: number;
};

/** num / den as a percentage with `decimals` places, from the exact fraction, rounded half up. */
export function percent(num: bigint, den: bigint, decimals: number): string {
  if (den <= ZERO) throw new Error('A percentage needs a positive whole.');
  const scale = TEN ** BigInt(decimals);
  const scaled = num * HUNDRED * scale;
  let units = scaled / den;
  if ((scaled % den) * TWO >= den) units += ONE;
  const whole = (units / scale).toString();
  return decimals > 0 ? `${whole}.${(units % scale).toString().padStart(decimals, '0')}%` : `${whole}%`;
}

/** num / den as a percentage for a width on screen, to four decimal places. Never shown as text. */
function width(num: bigint, den: bigint): number {
  return Number((num * BigInt(1_000_000)) / den) / 10_000;
}

const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** A whole number with thousands separators: 10,810,810. Exact for any count the table holds. */
function count(value: bigint): string {
  return wholeNumber.format(Number(value));
}

/** Whole dollars with thousands separators: $300,000. */
export function money(dollars: number | bigint): string {
  return `$${wholeNumber.format(Number(dollars))}`;
}

/** The investment the figures are for: whole dollars, no less than the minimum and no more than the round. Anything unreadable is the minimum. */
export function snapAmount(config: Pick<CapTableConfig, 'raise' | 'minimum'>, amount: number): number {
  if (!Number.isFinite(amount)) return config.minimum;
  return Math.min(config.raise, Math.max(config.minimum, Math.floor(amount)));
}

/**
 * Every figure the cap table shows for an investment. The config must be
 * one the admin accepts (src/content/registry.ts checks it): a round smaller
 * than the cap, and shares on the table today.
 */
export function capTableView(config: CapTableConfig, investment: number): CapTableView {
  const amount = snapAmount(config, investment);
  const raise = BigInt(config.raise);
  const cap = BigInt(config.cap);
  const inv = BigInt(amount);
  const othersInv = raise - inv;
  const today = config.holders.reduce((sum, holder) => sum + BigInt(holder.shares), ZERO);
  // What the cap leaves after the round: the round converts at net / today per share.
  const net = cap - raise;
  if (today <= ZERO || net <= ZERO) throw new Error('The cap table needs shares today and a round smaller than the cap.');

  const converted = (dollars: bigint) => (dollars * today) / net;
  const youShares = converted(inv);
  const othersShares = converted(othersInv);
  // Existing holders own shares * net / (today * cap): their shares over the exact capitalization after the round.
  const existingDen = today * cap;

  const existing: HolderRow[] = config.holders.map((holder) => {
    const shares = BigInt(holder.shares);
    return {
      holder: holder.holder,
      class: holder.class,
      today: percent(shares, today, 1),
      after: percent(shares * net, existingDen, 2),
      shares: count(shares),
      bar: width(shares * net, existingDen),
    };
  });

  return {
    amount,
    youAmount: money(inv),
    shareOfRound: percent(inv, raise, (inv * HUNDRED) % raise === ZERO ? 0 : 1),
    remaining: money(othersInv),
    othersAmount: othersInv > ZERO ? money(othersInv) : null,
    roundAmount: money(raise),
    roundPercent: percent(raise, cap, 1),
    minimumAmount: money(config.minimum),
    todayNone: percent(ZERO, ONE, 1),
    existing,
    you: { after: percent(inv, cap, 2), shares: count(youShares), bar: width(inv, cap) },
    others: { after: percent(othersInv, cap, 2), shares: count(othersShares), bar: width(othersInv, cap) },
    totalToday: { percent: percent(ONE, ONE, 1), shares: count(today) },
    // Everyone after the round: the existing holders' net / cap and the round's raise / cap make exactly one.
    totalAfter: { percent: percent(ONE, ONE, 2), shares: count(today + youShares + othersShares) },
    minimumAt: width(BigInt(config.minimum), raise),
    split: width(inv, raise),
  };
}

/**
 * The placeholders the cap table's copy may use (Content, Data Room, The
 * round), each filled from the figures above, so no figure is ever typed into
 * the copy: {round} the round ($750,000), {percent} the share of the company
 * it converts to (7.5%), {minimum} the smallest investment ($50,000),
 * {amount} the reader's investment ($300,000), {share} their share of the
 * round (40%), and {ownership} their ownership after conversion (3.00%).
 */
export const CAP_TABLE_PLACEHOLDERS = ['{round}', '{percent}', '{minimum}', '{amount}', '{share}', '{ownership}'] as const;

/** The copy with each placeholder filled for this view. Text without placeholders comes back as it was. */
export function capTableCopy(text: string, view: CapTableView): string {
  const values: Record<string, string> = {
    round: view.roundAmount,
    percent: view.roundPercent,
    minimum: view.minimumAmount,
    amount: view.youAmount,
    share: view.shareOfRound,
    ownership: view.you.after,
  };
  return text.replace(/\{(round|percent|minimum|amount|share|ownership)\}/g, (_, name: string) => values[name]!);
}
