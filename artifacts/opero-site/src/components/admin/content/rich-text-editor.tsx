import { useState } from 'react';
import { richToText, textToRich, type RichDoc } from '@/lib/rich-text';

type Props = { value: RichDoc; onChange: (doc: RichDoc) => void; labelId: string; describedBy?: string; invalid?: boolean };

/**
 * Dependency-free paragraph editor for the migrated client. Existing marked
 * documents remain unchanged until the user edits them; edits become plain
 * paragraphs with line breaks and never introduce unsafe markup.
 */
export function RichTextEditor({ value, onChange, labelId, describedBy, invalid }: Props) {
  const [text, setText] = useState(() => richToText(value));
  return <div className="overflow-hidden rounded-lg border border-line-input bg-surface focus-within:border-accent">
    <textarea
      className="rich-editor min-h-28 w-full resize-y bg-transparent px-3.5 py-3 text-base text-fg outline-none"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      value={text}
      onChange={event => { setText(event.target.value); onChange(textToRich(event.target.value)); }}
    />
  </div>;
}