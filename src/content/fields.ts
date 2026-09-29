import { z } from 'zod';
import { isSafeHref, richDocSchema, type RichDoc } from '@/lib/rich-text';

/**
 * The building blocks of editable content. A section declares its fields
 * once; from that declaration come the admin form, the validation, and the
 * TypeScript type of the data the page component receives.
 */

type Base = { label: string; hint?: string; optional?: boolean };

/**
 * `multiline` gives longer text a bigger box. `headline` is for headlines: Enter
 * starts a new line, and words between asterisks are emphasized (src/lib/headline.tsx).
 */
export type TextField = Base & { kind: 'text'; max?: number; multiline?: boolean; headline?: boolean };
export type RichField = Base & { kind: 'rich' };
/** A button or link target: a path on the site, a web address, or `#book-demo` for the demo form. */
export type LinkField = Base & { kind: 'link' };
export type ChoiceField<V extends string = string> = Base & { kind: 'choice'; options: readonly { value: V; label: string }[] };
/**
 * A figure stored as a number, never as prose: a share count, an amount of
 * money, a limit. `min`, `max` and `step` bound it (and shape the admin's
 * input); `integer` refuses fractions.
 */
export type NumberField = Base & { kind: 'number'; min?: number; max?: number; step?: number; integer?: boolean };

export type ItemField = TextField | RichField | LinkField | ChoiceField | NumberField;

export type ListField<I extends Record<string, ItemField> = Record<string, ItemField>> = Base & {
  kind: 'list';
  /** What one item is called in the admin, e.g. "Stat". */
  itemLabel: string;
  fields: I;
  min?: number;
  max?: number;
};

export type Field = ItemField | ListField;
export type Fields = Record<string, Field>;

type ItemValue<F> = F extends TextField
  ? string
  : F extends RichField
    ? RichDoc
    : F extends LinkField
      ? string
      : F extends ChoiceField<infer V>
        ? V
        : F extends NumberField
          ? number
          : never;

type FieldValue<F> = F extends ListField<infer I> ? { [K in keyof I]: ItemValue<I[K]> }[] : ItemValue<F>;

/** The data shape for a set of fields. */
export type Values<F extends Fields> = { [K in keyof F]: FieldValue<F[K]> };

/* Constructors keep declarations short and fully typed. */
export const text = (label: string, options: Omit<TextField, 'kind' | 'label'> = {}): TextField => ({ kind: 'text', label, ...options });
export const rich = (label: string, options: Omit<RichField, 'kind' | 'label'> = {}): RichField => ({ kind: 'rich', label, ...options });
export const link = (label: string, options: Omit<LinkField, 'kind' | 'label'> = {}): LinkField => ({ kind: 'link', label, ...options });
export const choice = <V extends string>(label: string, options: readonly { value: V; label: string }[], rest: Omit<ChoiceField<V>, 'kind' | 'label' | 'options'> = {}): ChoiceField<V> => ({
  kind: 'choice',
  label,
  options,
  ...rest,
});
export const number = (label: string, options: Omit<NumberField, 'kind' | 'label'> = {}): NumberField => ({ kind: 'number', label, ...options });
export const list = <I extends Record<string, ItemField>>(label: string, itemLabel: string, fields: I, options: Omit<ListField<I>, 'kind' | 'label' | 'itemLabel' | 'fields'> = {}): ListField<I> => ({
  kind: 'list',
  label,
  itemLabel,
  fields,
  ...options,
});

/* ------------------------------------------------------------------------ */
/* Validation                                                               */
/* ------------------------------------------------------------------------ */

/** A headline's lines, each trimmed, without blank ones. */
const tidyLines = (value: string) =>
  value
    .split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

function itemSchema(field: ItemField): z.ZodType {
  switch (field.kind) {
    case 'text': {
      let s = z.string().trim().max(field.max ?? 2000, `Keep this under ${field.max ?? 2000} characters.`);
      if (!field.optional) s = s.min(1, `${field.label} cannot be empty.`);
      // One break between lines: blank lines and spaces around a break would only add gaps.
      return field.headline ? z.preprocess((value) => (typeof value === 'string' ? tidyLines(value) : value), s) : s;
    }
    case 'rich':
      return richDocSchema.refine(
        (doc) => field.optional || doc.content.some((p) => p.content?.some((n) => n.type === 'text' && n.text.trim())),
        `${field.label} cannot be empty.`,
      );
    case 'link': {
      const s = z.string().trim().max(2000);
      return field.optional
        ? s.refine((v) => v === '' || isSafeHref(v), 'Use a path like /partners, a full web address, or #book-demo.')
        : s.refine(isSafeHref, 'Use a path like /partners, a full web address, or #book-demo.');
    }
    case 'choice':
      return z.enum(field.options.map((o) => o.value) as [string, ...string[]]);
    case 'number': {
      // Coerced, so the admin's input can hand over a string. A blank is a missing figure, not zero.
      let s = z.coerce.number({ error: `${field.label} needs a number.` });
      if (field.integer) s = s.int(`${field.label} must be a whole number.`);
      if (field.min !== undefined) s = s.min(field.min, `${field.label} must be at least ${field.min.toLocaleString('en-US')}.`);
      if (field.max !== undefined) s = s.max(field.max, `${field.label} must be at most ${field.max.toLocaleString('en-US')}.`);
      return z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), s);
    }
  }
}

function fieldSchema(field: Field): z.ZodType {
  if (field.kind !== 'list') return itemSchema(field);
  const item = z.object(Object.fromEntries(Object.entries(field.fields).map(([k, f]) => [k, itemSchema(f)])));
  let s = z.array(item);
  if (field.min) s = s.min(field.min, `Add at least ${field.min} ${field.itemLabel.toLowerCase()}${field.min === 1 ? '' : 's'}.`);
  if (field.max) s = s.max(field.max, `Add at most ${field.max}.`);
  return s;
}

/** A problem found across a section's fields, shown on the field named. */
export type SectionIssue = { field: string; message: string };
/**
 * A check across a section's fields, run once every field has passed its
 * own validation: for figures that must agree with each other, like a
 * slider's bounds.
 */
// Written as a method so a section typed with its own fields still fits the general `SectionDef<Fields>`.
export type SectionCheck<F extends Fields> = { check(values: Values<F>): SectionIssue[] }['check'];

/** A zod schema that validates (and cleans) data for the given fields, then runs the section's check, if any. */
export function schemaFor<F extends Fields>(fields: F, check?: SectionCheck<F>): z.ZodType<Values<F>> {
  const object = z.object(Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, fieldSchema(f)])));
  const schema = check
    ? object.superRefine((values, ctx) => {
        for (const issue of check(values as Values<F>)) ctx.addIssue({ code: 'custom', path: [issue.field], message: issue.message });
      })
    : object;
  return schema as unknown as z.ZodType<Values<F>>;
}
