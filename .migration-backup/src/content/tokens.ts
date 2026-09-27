import { mapRichText, type RichDoc } from '@/lib/rich-text';

/**
 * Copy can say {partner}, {partners}, {Partner}, or {Partners}; each is
 * filled in from the partner program label setting, so changing the label
 * (for example to "strategic customer") updates every page and email.
 * {email} is filled in from the contact email setting.
 */

export const tokenHelp =
  'Use {partner} or {partners} for the partner program label ({Partner} or {Partners} at the start of a sentence), and {email} for the contact email.';

export function pluralize(noun: string): string {
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(noun)) return `${noun}es`;
  return `${noun}s`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type TokenValues = Record<string, string>;

export function contentTokens({ partnerLabel, contactEmail }: { partnerLabel: string; contactEmail: string }): TokenValues {
  const singular = partnerLabel.trim() || 'design partner';
  const plural = pluralize(singular);
  return {
    '{partner}': singular,
    '{partners}': plural,
    '{Partner}': capitalize(singular),
    '{Partners}': capitalize(plural),
    '{email}': contactEmail,
  };
}

export function fillTokens(text: string, tokens: TokenValues): string {
  return text.replace(/\{(partners?|Partners?|email)\}/g, (match) => tokens[match] ?? match);
}

function isRichDoc(value: unknown): value is RichDoc {
  return typeof value === 'object' && value !== null && (value as { type?: unknown }).type === 'doc';
}

/** Fills tokens everywhere in a section's data: plain strings, rich text, and lists. */
export function fillTokensDeep<T>(value: T, tokens: TokenValues): T {
  if (typeof value === 'string') return fillTokens(value, tokens) as T;
  if (isRichDoc(value)) return mapRichText(value, (text) => fillTokens(text, tokens)) as T;
  if (Array.isArray(value)) return value.map((item) => fillTokensDeep(item, tokens)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTokensDeep(v, tokens)])) as T;
  }
  return value;
}
