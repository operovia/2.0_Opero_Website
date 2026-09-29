import { DoorOpen } from 'lucide-react';
import Link from 'next/link';

/**
 * The way into the admin from the public site. The site layout shows it only
 * to signed-in admins; visitors never see it. Its own landmark, so the link
 * sits inside a region for assistive technology like everything else on the page.
 */
export function AdminDoor() {
  return (
    <nav aria-label="Admin">
      <Link
        href="/admin"
        prefetch={false}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-4 py-2 text-sm font-semibold text-fg shadow-lg transition-colors hover:border-fg-subtle"
      >
        <DoorOpen aria-hidden className="size-4" />
        Admin
      </Link>
    </nav>
  );
}
