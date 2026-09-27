'use client';

import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { UndoRedo } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Bold as BoldIcon, Italic as ItalicIcon, Link2, Link2Off } from 'lucide-react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { isSafeHref, type RichDoc } from '@/lib/rich-text';

/** Defined once, so every render passes the very same extensions to the editor. */
const extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  HardBreak,
  UndoRedo,
  Link.configure({
    openOnClick: false,
    autolink: false,
    linkOnPaste: true,
    HTMLAttributes: { rel: null, target: null },
    isAllowedUri: (url) => isSafeHref(url),
  }),
];

type Props = {
  value: RichDoc;
  onChange: (doc: RichDoc) => void;
  labelId: string;
  describedBy?: string;
  invalid?: boolean;
};

/**
 * A deliberately plain paragraph editor: bold, italic, links, and line
 * breaks (Shift+Enter), nothing that could break the page design. Pasted
 * content keeps its text and loses any other formatting.
 */
export function RichTextEditor({ value, onChange, labelId, describedBy, invalid }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkInputId = useId();

  // Options must stay identical between renders, or the editor re-applies
  // them on every keystroke and can drop formatting mid-edit.
  const [initialContent] = useState(value);
  const editorProps = useMemo(
    () => ({
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(invalid ? { 'aria-invalid': 'true' } : {}),
        class: 'rich-editor min-h-28 px-3.5 py-3 text-base text-fg outline-none',
      },
    }),
    [labelId, describedBy, invalid],
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      link: editor?.isActive('link') ?? false,
      currentHref: (editor?.getAttributes('link').href as string | undefined) ?? '',
    }),
  });

  const openLink = () => {
    setHref(state?.currentHref ?? '');
    setLinkError('');
    setLinkOpen(true);
  };

  const applyLink = () => {
    const value = href.trim();
    if (!value) {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      return;
    }
    if (!isSafeHref(value)) {
      setLinkError('Use a full web address (https://...), an email (mailto:...), or a path on this site like /partners.');
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
    setLinkOpen(false);
  };

  return (
    <div
      className={cn(
        'rounded-md border bg-surface shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-focus-ring focus-within:ring-2 focus-within:ring-focus-ring/40',
        invalid ? 'border-danger' : 'border-line-input',
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <ToolbarButton label="Bold (Ctrl+B)" active={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <BoldIcon className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Italic (Ctrl+I)" active={state?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label={state?.link ? 'Edit link' : 'Add link'} active={state?.link || linkOpen} onClick={openLink}>
          <Link2 className="size-4" aria-hidden />
        </ToolbarButton>
        {state?.link ? (
          <ToolbarButton label="Remove link" onClick={() => editor?.chain().focus().extendMarkRange('link').unsetLink().run()}>
            <Link2Off className="size-4" aria-hidden />
          </ToolbarButton>
        ) : null}
        <span className="ml-auto hidden pr-1 text-xs text-fg-subtle sm:inline">Shift+Enter for a line break</span>
      </div>

      {linkOpen ? (
        <div className="space-y-2 border-b border-line bg-surface-raised px-3 py-3">
          <label htmlFor={linkInputId} className="block text-sm font-medium text-fg">
            Link address
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id={linkInputId}
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === 'Escape') setLinkOpen(false);
              }}
              placeholder="https://, mailto:, or /partners"
              autoFocus
              aria-invalid={linkError ? true : undefined}
              aria-describedby={linkError ? `${linkInputId}-error` : undefined}
              className="h-9 min-w-0 flex-1 rounded-md border border-line-input bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-focus-ring focus-visible:outline-none"
            />
            <button type="button" onClick={applyLink} className="h-9 rounded-full bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover">
              Apply
            </button>
            <button type="button" onClick={() => setLinkOpen(false)} className="h-9 rounded-full px-3 text-sm text-fg-muted hover:text-fg">
              Cancel
            </button>
          </div>
          {linkError ? (
            <p id={`${linkInputId}-error`} className="text-sm text-danger">
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active ?? false}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md transition-colors duration-150',
        active ? 'bg-accent text-on-accent' : 'text-fg-muted hover:bg-accent-soft hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
