'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';

/** Shown in place of an admin page that failed on the server. The menu, and any database notice, stay above it. */
export default function AdminPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="This page could not load" description="Something went wrong on the server while preparing it." />
      <Notice tone="danger" title="Where to look">
        If a notice above says the database is not up to date, that is the cause: update it there, then try again. Otherwise the Site health card on the
        Dashboard shows what went wrong on this server{error.digest ? `, under reference ${error.digest}` : ''}.
      </Notice>
      <div className="flex flex-wrap gap-3">
        <Button onClick={retry}>Try again</Button>
        <Link href="/admin" className={buttonClasses({ variant: 'secondary' })}>
          Go to the Dashboard
        </Link>
      </div>
    </div>
  );
}
