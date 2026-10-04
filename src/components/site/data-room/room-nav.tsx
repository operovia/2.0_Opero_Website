'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/site/layout-parts';
import { DATA_ROOM_CAP_TABLE_PATH, DATA_ROOM_FILES_PATH, DATA_ROOM_PATH, DATA_ROOM_RAISE_PATH } from '@/content/constants';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';

/**
 * The strip at the top of the Data Room's pages: the room's name and its
 * four tabs, Founder (the introduction and the story), The Raise (the
 * round's terms, and what runs today against what the raise builds), Cap
 * Table (with the investment model) and Documents (the folders and files).
 * The current tab is read from the address, so the strip is the same on
 * every page; on phones it scrolls sideways.
 */
export function RoomNav({ room }: { room: SectionData<'dataRoom', 'room'> }) {
  const pathname = usePathname();
  const items = [
    { href: DATA_ROOM_PATH, label: room.founderTab, active: pathname === DATA_ROOM_PATH },
    { href: DATA_ROOM_RAISE_PATH, label: room.raiseTab, active: pathname === DATA_ROOM_RAISE_PATH },
    { href: DATA_ROOM_CAP_TABLE_PATH, label: room.capTableTab, active: pathname === DATA_ROOM_CAP_TABLE_PATH },
    { href: DATA_ROOM_FILES_PATH, label: room.documentsTab, active: pathname.startsWith(DATA_ROOM_FILES_PATH) },
  ];
  return (
    <nav aria-label={room.label} className="relative z-10 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <Container className="swipe-row flex h-12 items-center gap-5 overflow-x-auto">
        <span className="text-eyebrow font-semibold whitespace-nowrap text-fg-subtle uppercase">{room.label}</span>
        <ul className="flex items-center gap-1">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
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
