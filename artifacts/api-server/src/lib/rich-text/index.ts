import { z } from 'zod';
import type { RichDoc, RichInline, RichMark, RichParagraph } from './types';

export type { RichDoc, RichInline, RichMark, RichParagraph } from './types';

/**
 * Link targets allowed in content: web links, email, phone, and paths or
 * anchors on this site. Anything else (javascript:, data:, ...) is refused.
 */
export function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (!value || /\s/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (value.startsWith('#')) return true;
  return /^(https?:\/\/[^/\s]+|mailto:[^\s]+|tel:[+\d][\d\s().-]*)/i.test(value);
}

const markSchema: z.ZodType<RichMark> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({ href: z.string().max(2000).refine(isSafeHref, 'Links must be web addresses, email addresses, or paths on this site.') }),
  }),
]);

const inlineSchema: z.ZodType<RichInline> = z.union([
  z.object({ type: z.literal('text'), text: z.string().min(1).max(10_000), marks: z.array(markSchema).max(3).optional() }),
  z.object({ type: z.literal('hardBreak') }),
]);

const paragraphSchema: z.ZodType<RichParagraph> = z.object({
  type: z.literal('paragraph'),
  content: z.array(inlineSchema).max(500).optional(),
});

/** Validates rich text and drops anything outside the allowed shape (extra attributes, unknown marks). */
export const richDocSchema: z.ZodType<RichDoc> = z.object({
  type: z.literal('doc'),
  content: z.array(paragraphSchema).min(1).max(50),
});

export const emptyRichDoc = (): RichDoc => ({ type: 'doc', content: [{ type: 'paragraph' }] });

/**
 * Plain text to rich text: blank lines separate paragraphs, single line
 * breaks become line breaks.
 */
export function textToRich(text: string): RichDoc {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .map((block): RichParagraph => {
      const content: RichInline[] = [];
      block.split('\n').forEach((line, i) => {
        if (i > 0) content.push({ type: 'hardBreak' });
        if (line) content.push({ type: 'text', text: line });
      });
      return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
    });
  return { type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] };
}

/** Rich text to plain text, keeping paragraph and line breaks. */
export function richToText(doc: RichDoc): string {
  return doc.content
    .map((p) => (p.content ?? []).map((n) => (n.type === 'text' ? n.text : '\n')).join(''))
    .join('\n\n');
}

export function isRichEmpty(doc: RichDoc | null | undefined): boolean {
  return !doc || richToText(doc).trim() === '';
}

/** Applies a function to every text run, e.g. to fill in {partner} tokens. */
export function mapRichText(doc: RichDoc, fn: (text: string) => string): RichDoc {
  return {
    type: 'doc',
    content: doc.content.map((p) =>
      p.content ? { ...p, content: p.content.map((n) => (n.type === 'text' ? { ...n, text: fn(n.text) } : n)) } : p,
    ),
  };
}
