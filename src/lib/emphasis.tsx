import type { ReactNode } from 'react';

/** Words between asterisks, like *The*, within one line. */
const marked = /\*([^*\n]+)\*/g;

/** A one-line text field with the words between asterisks set in italics. Everything else stays plain text. */
export function withEmphasis(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(marked)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<em key={match.index}>{match[1]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** The same text without the asterisks, for places that show it plain. */
export function withoutEmphasis(text: string): string {
  return text.replace(marked, '$1');
}
