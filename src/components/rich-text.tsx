import { Fragment, type ReactNode } from 'react';
import { SiteLink } from '@/components/site/site-link';
import { cn } from '@/lib/cn';
import type { RichDoc, RichInline } from '@/lib/rich-text';

function renderInline(node: RichInline, key: number): ReactNode {
  if (node.type === 'hardBreak') return <br key={key} />;
  let content: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') content = <strong className="font-semibold text-fg">{content}</strong>;
    else if (mark.type === 'italic') content = <em>{content}</em>;
    else if (mark.type === 'link')
      content = (
        <SiteLink href={mark.attrs.href} className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg">
          {content}
        </SiteLink>
      );
  }
  return <Fragment key={key}>{content}</Fragment>;
}

/** Renders editor-authored rich text: paragraphs, bold, italic, links, and line breaks. */
export function RichText({ doc, className, paragraphClassName }: { doc: RichDoc; className?: string; paragraphClassName?: string }) {
  const paragraphs = doc.content.filter((p) => p.content?.length);
  return (
    <div className={cn('space-y-5', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className={paragraphClassName}>
          {p.content!.map(renderInline)}
        </p>
      ))}
    </div>
  );
}
