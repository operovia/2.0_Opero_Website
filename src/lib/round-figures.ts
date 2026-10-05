import { money } from './cap-table-math';

/*
 * The round's figures in The Raise's copy. The terms and the "What the
 * investor gets" paragraph name the saved figures (Content, Data Room, The
 * round) by token rather than typing them, so each figure is typed once, in
 * its number field, and The Raise always agrees with the cap table, whose
 * sums read the same numbers (src/lib/cap-table-math.ts).
 */

/** The tokens, and what each shows: the round, the cap and the minimum in full, and the cap in millions as prose says it. */
export const ROUND_FIGURE_TOKENS = ['{round}', '{cap}', '{minimum}', '{cap in millions}'] as const;

export type RoundFigures = { raise: number; cap: number; minimum: number };

const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/**
 * Dollars in millions, as a sentence says them: $10 million, $12.5 million.
 * An amount that is not a whole tenth of a million, or is under a million,
 * reads in full ($9,999,999), so no figure is ever rounded.
 */
export function millions(dollars: number): string {
  if (!Number.isInteger(dollars) || dollars < 1_000_000 || dollars % 100_000 !== 0) return money(dollars);
  const whole = wholeNumber.format(Math.floor(dollars / 1_000_000));
  const tenths = (dollars % 1_000_000) / 100_000;
  return `$${tenths ? `${whole}.${tenths}` : whole} million`;
}

/** The copy with each figure token replaced by the saved figure. Text without tokens comes back as it was. */
export function fillRoundFigures(text: string, { raise, cap, minimum }: RoundFigures): string {
  return text.replace(/\{(round|cap|minimum|cap in millions)\}/g, (_, name: string) => {
    if (name === 'round') return money(raise);
    if (name === 'cap') return money(cap);
    if (name === 'minimum') return money(minimum);
    return millions(cap);
  });
}

/** The placeholders in a piece of copy that are neither among `known` nor one of the site's own ({partner}, {email} and the like). */
export function unknownPlaceholders(text: string, known: readonly string[]): string[] {
  return (text.match(/\{[^{}]*\}/g) ?? []).filter((token) => !known.includes(token) && !/^\{(partners?|Partners?|email)\}$/.test(token));
}

/** The tokens in a piece of The Raise's copy that are neither a round figure nor one of the site's own. */
export function unknownTokens(text: string): string[] {
  return unknownPlaceholders(text, ROUND_FIGURE_TOKENS);
}
