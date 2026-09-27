import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { requireAdmin } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Dashboard' };

const shortcuts = [
  { href: '/admin/settings', title: 'Settings', text: 'Site name, contact email, notifications, and maintenance mode.' },
  { href: '/admin/team', title: 'Team', text: 'Invite other admins and manage access.' },
  { href: '/admin/activity', title: 'Activity', text: 'Sign-ins and changes made in the admin.' },
];

export default async function DashboardPage() {
  const { user } = await requireAdmin();
  const firstName = user.name.split(' ')[0];
  return (
    <div className="space-y-8">
      <PageHeader title={firstName ? `Welcome, ${firstName}` : 'Welcome'} description="Manage the Opero site from here." />
      <div className="grid gap-4 sm:grid-cols-3">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="group rounded-xl focus-visible:outline-offset-4">
            <Card className="h-full transition-colors duration-150 group-hover:border-line-strong">
              <CardBody>
                <p className="font-semibold text-fg">{item.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{item.text}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
