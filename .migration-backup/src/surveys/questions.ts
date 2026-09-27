import { z } from 'zod';
import { hasOptions, questionTypes, type SurveyQuestion } from './types';

/** Ids for options made in the builder: short, random, and safe in form field values. */
export const OPTION_ID = /^[a-z0-9]{4,24}$/;

/** Ids for questions not yet saved; the server gives them real ids. */
export const NEW_QUESTION = /^new-[a-z0-9]{4,24}$/;

export function newId(): string {
  return Math.random().toString(36).slice(2, 12).padEnd(8, '0');
}

const optionSchema = z.object({
  id: z.string().regex(OPTION_ID, 'That option could not be saved. Reload the page and try again.'),
  label: z.string().trim().min(1, 'Give every option a label.').max(200, 'Keep option labels under 200 characters.'),
});

export const questionDraftSchema = z
  .object({
    id: z.string().max(64),
    type: z.enum(questionTypes),
    prompt: z.string().trim().min(1, 'Write the question.').max(500, 'Keep the question under 500 characters.'),
    helpText: z.string().trim().max(1000, 'Keep the help text under 1,000 characters.'),
    required: z.boolean(),
    options: z.array(optionSchema).max(30, 'Use at most 30 options.'),
  })
  .transform((q) => ({ ...q, options: hasOptions(q.type) ? q.options : [] }))
  .superRefine((q, ctx) => {
    if (!hasOptions(q.type)) return;
    if (q.options.length < 2) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Add at least two options.' });
    const ids = new Set(q.options.map((o) => o.id));
    if (ids.size !== q.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Two options share an id. Reload the page and try again.' });
    const labels = new Set(q.options.map((o) => o.label.toLowerCase()));
    if (labels.size !== q.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Each option needs a different label.' });
  });

export type QuestionDraft = z.output<typeof questionDraftSchema>;

export const questionListSchema = z.array(questionDraftSchema).max(100, 'A survey can have up to 100 questions.');

/**
 * Once a survey has responses, only wording may change, so every answer
 * keeps meaning what it meant. Returns why a change is refused, or null.
 */
export function structuralChange(before: SurveyQuestion[], after: QuestionDraft[]): string | null {
  if (before.length !== after.length) return 'Questions cannot be added or removed once a survey has responses.';
  for (const [i, old] of before.entries()) {
    const next = after[i]!;
    if (next.id !== old.id) return 'Questions cannot be reordered, added, or removed once a survey has responses.';
    if (next.type !== old.type) return "A question's type cannot change once a survey has responses.";
    if (next.required !== old.required) return 'Whether a question is required cannot change once a survey has responses.';
    if (next.options.map((o) => o.id).join() !== old.options.map((o) => o.id).join()) {
      return 'Options cannot be added, removed, or reordered once a survey has responses. You can still reword them.';
    }
  }
  return null;
}

/** A URL-friendly slug from a title: lowercase letters, numbers, and single hyphens. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters.')
  .max(60, 'Keep the address under 60 characters.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.');
