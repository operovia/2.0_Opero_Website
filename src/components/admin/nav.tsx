'use client';

import {
  Activity,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export type NavKey = 'dashboard' | 'inquiries' | 'content' | 'console' | 'surveys' | 'media' | 'settings' | 'team' | 'activity';

const items: { key: NavKey; href: string; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inquiries', href: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { key: 'content', href: '/admin/content', label: 'Content', icon: FileText },
  { key: 'console', href: '/admin/console', label: 'Oppie console', icon: MessageSquareText },
  { key: 'surveys', href: '/admin/surveys', label: 'Surveys', icon: ListChecks },
  { key: 'media', href: '/admin/media', label: 'Media', icon: ImageIcon },
  { key: 'settings', href: '/admin/settings', label: 'Settings', icon: Settings },
  { key: 'team', href: '/admin/team', label: 'Team', icon: Users },
  { key: 'activity', href: '/admin/activity', label: 'Activity', icon: Activity },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin navigation. Only sections listed in `enabled` are shown. */
export function AdminNav({ enabled, badges = {}, onNavigate }: { enabled: NavKey[]; badges?: Partial<Record<NavKey, number>>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="space-y-1">
        {items
          .filter((item) => enabled.includes(item.key))
          .map(({ key, href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            const badge = badges[key];
            return (
              <li key={key}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
                    active ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:bg-accent-soft hover:text-fg',
                  )}
                >
                  <Icon aria-hidden className="size-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
                      {badge}
                      <span className="sr-only"> new</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
