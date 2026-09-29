/**
 * Writes the large Oppie mark (the site's `large` option, at rest) as
 * standalone SVG files for dark and light backgrounds:
 *
 *   npx tsx scripts/export-oppie-large.ts
 *
 * They are drawn by the same component and tokens as the site, so they always
 * match it. Run it again after changing the mark or its tokens.
 */
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OppieMark } from '../src/components/brand/oppie-mark';

/** One tag per line, indented by nesting. The mark has no text, only tags. */
function indent(markup: string): string {
  let depth = 0;
  return markup
    .split(/(?<=>)(?=<)/)
    .map((tag) => {
      if (tag.startsWith('</')) depth--;
      const line = '  '.repeat(depth) + tag;
      if (!tag.startsWith('</') && !tag.endsWith('/>')) depth++;
      return line;
    })
    .join('\n');
}

for (const on of ['dark', 'light'] as const) {
  const markup = renderToStaticMarkup(createElement(OppieMark, { on, large: true, still: true, decorative: true }));
  const svg = markup.match(/<svg[\s\S]*<\/svg>/)![0];
  const prefix = svg.match(/id="([A-Za-z0-9_-]+)-build"/)![1]!;
  const file = `public/brand/oppie/oppie-large-${on}.svg`;
  const tidy = svg
    .replaceAll(prefix, 'oppie')
    .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Oppie">')
    .replace(/><\/(stop|rect)>/g, '/>')
    // At rest the side shade is hidden, and the highlight's group exists only to move it.
    .replace(/<rect[^>]*class="oppie-shade"[^>]*\/>/g, '')
    .replace(/<g class="oppie-glint">(<rect[^>]*\/>)<\/g>/g, '$1')
    .replace(/ (class|style)="[^"]*"/g, '');
  writeFileSync(file, `${indent(tidy)}\n`);
  console.log(file);
}
