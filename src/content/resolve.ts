import { schemaFor, withSeed, type Values } from './fields';
import type { SectionDef } from './registry';

/**
 * Something wrong with a section's stored content, for the admin: the field,
 * its label, and what is wrong. `fields`: a field cannot be read at all;
 * `check`: every field reads, but they disagree with each other.
 */
export type SectionProblem = { field: string; label: string; message: string; kind: 'fields' | 'check' };

function problem(def: SectionDef, path: readonly PropertyKey[], message: string, kind: SectionProblem['kind']): SectionProblem {
  const field = String(path[0] ?? '');
  return { field, label: def.fields[field]?.label ?? field, message, kind };
}

/**
 * A section's stored content as a page shows it: merged over the seed (for
 * fields saved before they existed), validated, with what is wrong with it.
 * Content that fails shows the shipped seed instead, except in a section
 * that withholds (its `withhold` in the registry), which never puts shipped
 * figures in place of the owner's: it keeps every stored field that reads,
 * and the page holds back whatever depends on the figures that disagree.
 */
export function resolveStored(def: SectionDef, stored: unknown): { data: unknown; problems: SectionProblem[] } {
  const merged = withSeed(def.fields, def.seed as Record<string, unknown>, stored);
  const read = schemaFor(def.fields).safeParse(merged);
  if (!read.success) return { data: def.seed, problems: read.error.issues.map((issue) => problem(def, issue.path, issue.message, 'fields')) };
  const issues = def.check ? def.check(read.data as Values<typeof def.fields>) : [];
  if (!issues.length) return { data: read.data, problems: [] };
  return { data: def.withhold ? read.data : def.seed, problems: issues.map((issue) => problem(def, [issue.field], issue.message, 'check')) };
}
