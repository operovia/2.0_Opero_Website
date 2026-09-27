'use client';

import { usePathname } from 'next/navigation';
import { exitPreview } from '@/app/(site)/preview-actions';

/** Shown to an admin viewing unpublished drafts. */
export function PreviewBanner() {
  const path = usePathname();
  return (
    <div role="status" className="sticky top-0 z-50 border-b border-warning/40 bg-warning-soft backdrop-blur-xl">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-gutter py-2.5 text-sm">
        <p className="text-fg">
          <span className="font-semibold">Preview.</span> You are seeing unpublished drafts. Visitors still see the published site.
        </p>
        <form action={exitPreview}>
          <input type="hidden" name="path" value={path} />
          <button type="submit" className="font-semibold text-fg underline underline-offset-4">
            Exit preview
          </button>
        </form>
      </div>
    </div>
  );
}
