#!/usr/bin/env node
/**
 * Enforces the house style: no em dashes (or en dashes standing in for them)
 * in anything a visitor, recipient, or admin reads. Scans source, seed
 * content, emails, docs, and brand files. AGENTS.md is written by Next.js
 * itself and is skipped.
 *
 * Also: the company Opero was built inside is never named (CLAUDE.md). It is
 * the founder's former company, or our flagship operator. Only the migrations
 * that replace the name in saved content may contain it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['src', 'scripts', 'public/brand', 'docs', 'drizzle'];
const files = ['CLAUDE.md', 'README.md', 'PLACEHOLDERS.md', '.env.example'];
const skipDirs = new Set(['node_modules', '.next', '.git', 'fonts']);
const textExt = /\.(ts|tsx|js|mjs|cjs|json|md|mdx|css|html|txt|sql|example)$/;
const skipFiles = new Set(['docs/brief.md']);
const dashes = /[–—]/;
// Spelled in two parts, so this file does not name it either.
const formerName = new RegExp(['ox', 'ford'].join(''), 'i');
const mayName = new Set(['drizzle/0009_round_labels.sql', 'drizzle/0013_flagship_operator.sql']);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (skipDirs.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (textExt.test(name)) out.push(full);
  }
}

const targets = [join(root, 'docs/brief.md')];
for (const dir of roots) walk(join(root, dir), targets);
for (const file of files) {
  try {
    statSync(join(root, file));
    targets.push(join(root, file));
  } catch {}
}

const problems = [];
const named = [];
for (const file of new Set(targets)) {
  const rel = relative(root, file);
  if (rel === 'scripts/check-copy.mjs') continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (dashes.test(line) && !skipFiles.has(rel)) problems.push(`${rel}:${i + 1}: ${line.trim()}`);
      if (formerName.test(line) && !mayName.has(rel)) named.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
}

if (problems.length) {
  console.error('Em or en dashes found. Use commas, periods, or colons instead:\n');
  for (const p of problems) console.error(`  ${p}`);
}
if (named.length) {
  console.error("\nThe founder's former company is named. Say the founder's former company, or our flagship operator:\n");
  for (const p of named) console.error(`  ${p}`);
}
if (problems.length || named.length) process.exit(1);
console.log(`Copy check passed (${targets.length} files).`);
