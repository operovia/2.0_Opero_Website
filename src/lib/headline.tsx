import { Fragment, type ReactNode } from 'react';

/*
 * How headlines typed in the admin are shown. Enter starts a new line, and
 * words between asterisks, like *this*, are set in italics, in the headline's
 * own metal. A headline can also name one word to set in the five jewel
 * colors (the hero's "Intelligent"), which is wrapped wherever it stands as
 * a whole word.
 */

/** Words between asterisks, like *The*, within one line. */
const marked = /\*([^*\n]+)\*/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The text with every whole-word occurrence of `accent` set in the jewel colors. */
function accentuate(text: string, accent: string | undefined, keyBase: string): ReactNode[] {
  if (!accent || !text.includes(accent)) return [text];
  const word = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(accent)}(?![\\p{L}\\p{N}])`, 'gu');
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(word)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`${keyBase}-${match.index}`} className="text-jewels">
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** One line with the words between asterisks emphasized. Everything else stays plain text. */
function emphasize(line: string, accent?: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(marked)) {
    if (match.index > last) parts.push(...accentuate(line.slice(last, match.index), accent, `p${match.index}`));
    parts.push(<em key={match.index}>{accentuate(match[1]!, accent, `e${match.index}`)}</em>);
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push(...accentuate(line.slice(last), accent, `t${last}`));
  return parts;
}

/** A headline with its line breaks and emphasis, and, given `accent`, that word in the jewel colors. */
export function renderHeadline(text: string, accent?: string): ReactNode[] {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {emphasize(line, accent?.trim() || undefined)}
    </Fragment>
  ));
}

/** The headline as plain text on one line, without the asterisks: for page titles and share images. */
export function plainHeadline(text: string): string {
  return text.replace(marked, '$1').replace(/\s*\n\s*/g, ' ');
}
