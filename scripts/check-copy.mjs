#!/usr/bin/env node
/**
 * Enforces the house style: no em dashes (or en dashes standing in for them)
 * in anything a visitor, recipient, or admin reads. Scans source, seed
 * content, emails, docs, and brand files. AGENTS.md is written by Next.js
 * itself and is skipped.
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

const targets = [];
for (const dir of roots) walk(join(root, dir), targets);
for (const file of files) {
  try {
    statSync(join(root, file));
    targets.push(join(root, file));
  } catch {}
}

const problems = [];
for (const file of targets) {
  const rel = relative(root, file);
  if (skipFiles.has(rel) || rel === 'scripts/check-copy.mjs') continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (dashes.test(line)) problems.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
}

if (problems.length) {
  console.error('Em or en dashes found. Use commas, periods, or colons instead:\n');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`Copy check passed (${targets.length} files).`);
