'use client';

import { Check, Eye, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * The front door's address, or a guest's personal link to it, with a button
 * that copies it for the invitation email. `preview`: the link's path on this
 * site, opened in a new tab to see it as the guest will.
 */
export function DoorLink({ link, compact, preview }: { link: string; compact?: boolean; preview?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt('Copy the door link:', link);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <code
        className={cn('min-w-0 flex-1 truncate rounded-md border border-line bg-surface-raised text-fg', compact ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm')}
      >
        {link}
      </code>
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      {preview ? (
        <a href={preview} target="_blank" rel="noopener" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          <Eye className="size-4" aria-hidden />
          Preview<span className="sr-only">, opens in a new tab</span>
        </a>
      ) : null}
    </div>
  );
}
