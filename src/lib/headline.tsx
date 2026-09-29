import { Fragment, type ReactNode } from 'react';

/*
 * How headlines typed in the admin are shown. In every headline, Enter starts
 * a new line; the hero headline also sets words between asterisks in italics.
 */

/** Words between asterisks, like *The*, within one line. */
const marked = /\*([^*\n]+)\*/g;

/** One line with the words between asterisks set in italics. Everything else stays plain text. */
function emphasize(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(marked)) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    parts.push(<em key={match.index}>{match[1]}</em>);
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/** A headline with its line breaks and, with `emphasis`, its italics. */
export function withLineBreaks(text: string, { emphasis = false }: { emphasis?: boolean } = {}): ReactNode[] {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {emphasis ? emphasize(line) : line}
    </Fragment>
  ));
}

/** The headline on one line, for page titles and share images. */
export function onOneLine(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ');
}

/** The headline without the asterisks, for places that show it plain. */
export function withoutEmphasis(text: string): string {
  return text.replace(marked, '$1');
}
