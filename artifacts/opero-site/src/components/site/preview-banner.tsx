'use client';

import { useLocation } from 'wouter';

/** Shown to an admin viewing unpublished drafts. */
export function PreviewBanner() {
  const [path] = useLocation();
  return (
    <div role="status" className="sticky top-0 z-50 border-b border-warning/40 bg-warning-soft backdrop-blur-xl">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-gutter py-2.5 text-sm">
        <p className="text-fg">
          <span className="font-semibold">Preview.</span> You are seeing unpublished drafts. Visitors still see the published site.
        </p>
        <form action={() => { window.location.href = path; }}>
          <input type="hidden" name="path" value={path} />
          <button type="submit" className="font-semibold text-fg underline underline-offset-4">
            Exit preview
          </button>
        </form>
      </div>
    </div>
  );
}
