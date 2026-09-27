/**
 * The deliberately small rich text format used for paragraph fields:
 * paragraphs of text with bold, italic, links, and line breaks, nothing else.
 * It is a subset of the ProseMirror/Tiptap JSON shape, so the admin editor
 * can load and save it directly.
 */

export type RichMark = { type: 'bold' } | { type: 'italic' } | { type: 'link'; attrs: { href: string } };

export type RichInline = { type: 'text'; text: string; marks?: RichMark[] } | { type: 'hardBreak' };

export type RichParagraph = { type: 'paragraph'; content?: RichInline[] };

export type RichDoc = { type: 'doc'; content: RichParagraph[] };
