import { Fragment, type ReactNode } from 'react';

/*
 * How headlines typed in the admin are shown. Enter starts a new line, and
 * words between asterisks, like *this*, are set in italics, in the headline's
 * own metal.
 */

/** Words between asterisks, like *The*, within one line. */
const marked = /\*([^*\n]+)\*/g;

/** One line with the words between asterisks emphasized. Everything else stays plain text. */
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

/** A headline with its line breaks and emphasis. */
export function renderHeadline(text: string): ReactNode[] {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {emphasize(line)}
    </Fragment>
  ));
}

/** The headline as plain text on one line, without the asterisks: for page titles and share images. */
export function plainHeadline(text: string): string {
  return text.replace(marked, '$1').replace(/\s*\n\s*/g, ' ');
}
