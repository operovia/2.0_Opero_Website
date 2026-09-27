import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/brand-mark';
import { MIN_PASSWORD_LENGTH } from '@/server/auth/password';
import { findUsableInvite } from '@/server/invites';
import { AcceptForm } from './accept-form';

export const metadata: Metadata = { title: 'Accept invitation', referrer: 'no-referrer' };

export default async function AcceptInvitePage({ searchParams }: PageProps<'/admin/accept-invite'>) {
  const { token } = await searchParams;
  const value = typeof token === 'string' ? token : '';
  const invite = await findUsableInvite(value);

  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <BrandMark name="opero" on="auto" className="mx-auto h-10" />
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 shadow-lg">
          {invite ? (
            <>
              <h1 className="text-xl font-semibold text-fg">Create your admin account</h1>
              <p className="mt-1 text-sm text-fg-muted">You were invited to help manage the Opero site.</p>
              <div className="mt-6">
                <AcceptForm token={value} email={invite.email} name={invite.name} minLength={MIN_PASSWORD_LENGTH} />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-fg">This link is no longer valid</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Invitation links work once and expire after 7 days. Ask an admin to send a new one.
              </p>
              <p className="mt-6 text-sm">
                <Link href="/admin/login" className="font-medium text-fg underline underline-offset-4">
                  Go to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
