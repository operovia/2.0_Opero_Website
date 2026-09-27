'use client';

import { Menu, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState, type ReactNode } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { cn } from '@/lib/cn';
import { AdminNav, type NavKey } from './nav';

type Props = {
  enabled: NavKey[];
  badges?: Partial<Record<NavKey, number>>;
  account: ReactNode;
  children: ReactNode;
};

/** Sidebar layout for the admin, with a collapsible menu on small screens. */
export function AdminShell({ enabled, badges, account, children }: Props) {
  const [pathname] = useLocation();
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        Skip to content
      </a>

      <header className="flex h-16 items-center justify-between border-b border-line px-gutter lg:hidden">
        <BrandMark name="opero-small" on="auto" className="h-7" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          className="inline-flex size-10 items-center justify-center rounded-md text-fg-muted hover:bg-accent-soft hover:text-fg"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>

      <aside
        id="admin-sidebar"
        aria-label="Admin menu"
        className={cn(
          'border-line bg-canvas-raised lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r',
          open ? 'flex flex-col border-b' : 'hidden',
        )}
      >
        <div className="hidden h-20 items-center px-6 lg:flex">
          <BrandMark name="opero-small" on="auto" className="h-8" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 lg:py-2">
          <AdminNav enabled={enabled} badges={badges} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-line px-4 py-4">{account}</div>
      </aside>

      <main id="admin-main" tabIndex={-1} className="min-w-0 px-gutter py-8 outline-none lg:px-10 lg:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
