'use client';

import { Eye, EyeOff } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { setVisitorView } from '@/app/(site)/visitor-view-actions';
import { cn } from '@/lib/cn';
import { adminPill } from './admin-pill';

/**
 * The switch beside the Admin pill: see the site as a visitor does (the
 * Founder page in the header, the Investor Hub hidden), and back again. While
 * it is on, the pill is edged in the warning color so the view is not
 * mistaken for the admin's own.
 */
export function VisitorViewSwitch({ on }: { on: boolean }) {
  const path = usePathname();
  return (
    <form action={setVisitorView}>
      <input type="hidden" name="path" value={path} />
      <input type="hidden" name="view" value={on ? 'admin' : 'visitor'} />
      <button type="submit" className={cn(adminPill, on ? 'border-warning' : 'border-line-strong hover:border-fg-subtle')}>
        {on ? <EyeOff aria-hidden className="size-4 text-warning" /> : <Eye aria-hidden className="size-4" />}
        {on ? 'Leave visitor view' : 'View as a visitor'}
      </button>
    </form>
  );
}
