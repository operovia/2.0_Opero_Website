import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_THEME_COOKIE, parseAdminTheme } from '@/server/admin-theme';

export const metadata: Metadata = {
  title: { template: '%s | Opero admin', default: 'Opero admin' },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);
  return (
    <div data-theme={theme} className="min-h-dvh">
      {children}
    </div>
  );
}
