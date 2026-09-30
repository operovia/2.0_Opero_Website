import { KeyRound, LogOut } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { logout } from '@/app/admin/actions';
import type { NavKey } from '@/components/admin/nav';
import { AdminShell } from '@/components/admin/shell';
import { ThemeSwitch } from '@/components/admin/theme-switch';
import { ADMIN_THEME_COOKIE, parseAdminTheme } from '@/server/admin-theme';
import { requireAdmin } from '@/server/auth/session';
import { newInquiryCount } from '@/server/inquiries-admin';
import { DatabaseNotice } from './database-notice';

/** Admin sections that exist so far; the list grows as each section ships. */
const enabled: NavKey[] = ['dashboard', 'inquiries', 'guests', 'content', 'console', 'surveys', 'media', 'settings', 'team', 'activity'];

export default async function PanelLayout({ children }: LayoutProps<'/admin'>) {
  const { user } = await requireAdmin();
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);
  const newInquiries = await newInquiryCount();

  const account = (
    <div className="space-y-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{user.name || user.email}</p>
        {user.name ? <p className="truncate text-xs text-fg-subtle">{user.email}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <ThemeSwitch current={theme} />
        <div className="flex items-center gap-1">
          <Link
            href="/admin/account"
            className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-accent-soft hover:text-fg"
            title="Change password"
          >
            <KeyRound aria-hidden className="size-4" />
            <span className="sr-only">Change password</span>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-accent-soft hover:text-fg"
              title="Sign out"
            >
              <LogOut aria-hidden className="size-4" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <AdminShell enabled={enabled} badges={{ inquiries: newInquiries }} account={account}>
      <DatabaseNotice />
      {children}
    </AdminShell>
  );
}
