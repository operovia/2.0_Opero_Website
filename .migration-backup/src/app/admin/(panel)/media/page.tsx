import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { requireAdmin } from '@/server/auth/session';
import { listMedia } from '@/server/media';
import { MediaLibrary } from './media-library';

export const metadata: Metadata = { title: 'Media' };

export default async function MediaPage() {
  await requireAdmin();
  const items = await listMedia();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Media"
        description="Images for the site. Upload them here, then copy an image's address to link to it, or choose one as the social share image in Settings."
      />
      <MediaLibrary items={items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
    </div>
  );
}
