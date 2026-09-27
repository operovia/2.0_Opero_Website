#!/usr/bin/env node
/**
 * Flags Tailwind classes used in source that produced no CSS. Tailwind is
 * limited to the design tokens, so a class like `text-white` or `max-w-sm`
 * with no matching token silently does nothing; this catches it.
 * Run after `npm run build`: node scripts/check-classes.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cssDir = join(root, '.next/static/chunks');
let css = '';
try {
  for (const f of readdirSync(cssDir)) if (f.endsWith('.css')) css += readFileSync(join(cssDir, f), 'utf8');
} catch {
  console.error('No build output found. Run `npm run build` first.');
  process.exit(1);
}

// Classes that are not Tailwind utilities: hooks for CSS in globals.css, or markers.
const allow = new Set(['group', 'peer', 'brand-on-dark', 'brand-on-light', 'dark', 'light']);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    // The theme folder holds token names, not class names.
    if (statSync(full).isDirectory()) {
      if (full !== join(root, 'src/theme')) walk(full, out);
    }
    else if (/\.(tsx|ts)$/.test(name) && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

/** CSS.escape for class selectors, enough for Tailwind class names. */
function escapeClass(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`).replace(/^(\d)/, '\\3$1 ');
}

const strings = /(?:className|class)=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})|cn\(([^)]*)\)|['"`]([^'"`\n]*)['"`]/g;
const unknown = new Map();
for (const file of walk(join(root, 'src'), [])) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(strings)) {
    const text = match.slice(1).find((g) => g !== undefined) ?? '';
    for (const token of text.split(/\s+/)) {
      // Only consider things that look like Tailwind classes.
      if (!/^[!a-z0-9:[\]\/._%()#,-]+$/i.test(token) || !/[a-z]-|^(flex|grid|block|hidden|inline|contents|truncate|sr-only|relative|absolute|fixed|sticky|static|italic|underline|uppercase|lowercase|capitalize|transform|shrink|grow)$/.test(token.split(':').pop())) continue;
      if (token.includes('${') || token.startsWith('--') || token.startsWith('/') || token.includes('://')) continue;
      const base = token.split(':').pop().replace(/^!/, '');
      if (allow.has(base) || /^(jewel|text-metal)/.test(base) && css.includes(`.${escapeClass(token)}`)) continue;
      if (css.includes(`.${escapeClass(token)}`)) continue;
      if (!unknown.has(token)) unknown.set(token, file.replace(`${root}/`, ''));
    }
  }
}

// Words in plain strings that merely look like classes are common; only report likely utilities.
const likely = [...unknown].filter(([token]) =>
  /^(?:[a-z-]+:)*!?-?(bg|text|border|ring|shadow|rounded|p[xytrbl]?|m[xytrbl]?|gap|space|w|h|size|min|max|inset|top|left|right|bottom|z|font|leading|tracking|flex|grid|col|row|items|justify|self|place|order|opacity|transition|duration|ease|translate|scale|rotate|outline|fill|stroke|decoration|underline-offset|aspect|object|overflow|whitespace|break|line-clamp|divide|backdrop|blur|from|via|to|accent|caret|cursor|pointer-events|select|resize|scroll|snap|list|table|align|content|animate)(-|$)/.test(token),
);

if (likely.length) {
  console.error('Classes with no generated CSS (missing token or typo):\n');
  for (const [token, file] of likely) console.error(`  ${token}  (${file})`);
  process.exit(1);
}
console.log('Class check passed.');
