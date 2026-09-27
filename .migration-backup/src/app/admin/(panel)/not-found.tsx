import Link from 'next/link';
import { EmptyState } from '@/components/ui/page-header';

export default function AdminNotFound() {
  return (
    <EmptyState title="That page does not exist">
      It may have been removed.{' '}
      <Link href="/admin" className="font-medium text-fg underline underline-offset-4">
        Go to the dashboard
      </Link>
    </EmptyState>
  );
}
