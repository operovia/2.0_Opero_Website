'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/site/layout-parts';
import { DATA_ROOM_FILES_PATH, DATA_ROOM_PATH } from '@/content/constants';
import { cn } from '@/lib/cn';

/**
 * The strip at the top of the Data Room's pages: the room's name and its two
 * tabs, Overview (the founder's story and the round) and Documents (the
 * folders and files). The current tab is read from the address, so the strip
 * is the same on both pages.
 */
export function RoomNav({ label, tabs }: { label: string; tabs: { overview: string; documents: string } }) {
  const pathname = usePathname();
  const items = [
    { href: DATA_ROOM_PATH, label: tabs.overview, active: pathname === DATA_ROOM_PATH },
    { href: DATA_ROOM_FILES_PATH, label: tabs.documents, active: pathname.startsWith(DATA_ROOM_FILES_PATH) },
  ];
  return (
    <nav aria-label={label} className="relative z-10 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <Container className="flex h-12 items-center gap-5">
        <span className="text-eyebrow font-semibold whitespace-nowrap text-fg-subtle uppercase">{label}</span>
        <ul className="flex items-center gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-150',
                  item.active ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
