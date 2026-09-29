'use client';

import { Check, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/** The front door's address, with a button that copies it for the invitation email. */
export function DoorLink({ link }: { link: string }) {
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
      <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-surface-raised px-3 py-2 text-sm text-fg">{link}</code>
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
