import type { ReactNode } from 'react';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The text with every whole-word occurrence of `phrase` (in any case) given
 * to `mark`, which wraps it, and everything else left as plain text. A
 * phrase that is empty or not in the text leaves the text as it is.
 */
export function highlight(text: string, phrase: string | undefined, mark: (words: string, key: number) => ReactNode): ReactNode[] {
  const wanted = phrase?.trim();
  if (!wanted) return [text];
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(wanted).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`, 'giu');
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(mark(match[0], match.index));
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
