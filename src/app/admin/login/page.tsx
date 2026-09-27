import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/brand/brand-mark';
import { safeAdminRedirect } from '@/server/auth/constants';
import { getSession } from '@/server/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { next } = await searchParams;
  const nextPath = typeof next === 'string' ? next : undefined;
  if (await getSession()) redirect(safeAdminRedirect(nextPath));

  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <BrandMark name="opero-small" on="auto" className="mx-auto h-10" />
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-fg">Sign in</h1>
          <p className="mt-1 text-sm text-fg-muted">Admin access for the Opero site.</p>
          <div className="mt-6">
            <LoginForm next={nextPath} />
          </div>
        </div>
      </div>
    </main>
  );
}
