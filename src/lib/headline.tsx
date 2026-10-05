import { Fragment, type ReactNode } from 'react';
import { highlight } from './highlight';

/*
 * How headlines typed in the admin are shown. Enter starts a new line, and
 * words between asterisks, like *this*, are set in italics, in the headline's
 * own metal. A headline can also name words to set in shimmering gold
 * (gold-shimmer in globals.css), matched as whole words, in or out of the
 * italics.
 */

/** Words between asterisks, like *The*, within one line. */
const marked = /\*([^*\n]+)\*/g;

/** A piece of a line with the named words in shimmering gold. */
const gilded = (text: string, gold: string | undefined, keyBase: string): ReactNode[] =>
  highlight(text, gold, (words, key) => (
    <span key={`${keyBase}-${key}`} className="gold-shimmer">
      {words}
    </span>
  ));

/** One line with the words between asterisks emphasized. Everything else stays plain text. */
function emphasize(line: string, gold?: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(marked)) {
    if (match.index > last) parts.push(...gilded(line.slice(last, match.index), gold, `p${match.index}`));
    parts.push(<em key={match.index}>{gilded(match[1]!, gold, `e${match.index}`)}</em>);
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push(...gilded(line.slice(last), gold, `t${last}`));
  return parts;
}

/** A headline with its line breaks and emphasis, and, given `gold`, those words in shimmering gold. */
export function renderHeadline(text: string, gold?: string): ReactNode[] {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {emphasize(line, gold)}
    </Fragment>
  ));
}

/** The headline as plain text on one line, without the asterisks: for page titles and share images. */
export function plainHeadline(text: string): string {
  return text.replace(marked, '$1').replace(/\s*\n\s*/g, ' ');
}
