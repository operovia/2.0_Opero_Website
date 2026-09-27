import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { MIN_PASSWORD_LENGTH } from '@/server/auth/password';
import { requireAdmin } from '@/server/auth/session';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Your account' };

export default async function AccountPage() {
  const { user } = await requireAdmin();
  return (
    <div className="space-y-8">
      <PageHeader title="Your account" description={`Signed in as ${user.email}.`} />
      <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
    </div>
  );
}
