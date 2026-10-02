import { DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { adminPill } from './admin-pill';
import { VisitorViewSwitch } from './visitor-view-switch';

/**
 * The way into the admin from the public site, and the switch to see the site
 * as a visitor does. The site shows them only to signed-in admins; visitors
 * never see them. Their own landmark, so the controls sit inside a region for
 * assistive technology like everything else on the page.
 */
export function AdminDoor({ asVisitor }: { asVisitor: boolean }) {
  return (
    <nav aria-label="Admin" className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
      <Link href="/admin" prefetch={false} className={cn(adminPill, 'border-line-strong hover:border-fg-subtle')}>
        <DoorOpen aria-hidden className="size-4" />
        Admin
      </Link>
      <VisitorViewSwitch on={asVisitor} />
    </nav>
  );
}
