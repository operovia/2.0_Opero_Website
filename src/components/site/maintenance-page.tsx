import { BrandMark } from '@/components/brand/brand-mark';
import type { SectionData } from '@/content/registry';
import { renderHeadline } from '@/lib/headline';
import { Aurora } from './aurora';

/** The holding page visitors see while maintenance mode is on. */
export function MaintenancePage({ content }: { content: SectionData<'site', 'maintenance'> }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-gutter text-center">
      <Aurora />
      <BrandMark name="opero" className="h-16 sm:h-20" priority />
      <h1 className="mt-12 max-w-2xl text-display-sm font-medium text-metal">{renderHeadline(content.headline)}</h1>
      <p className="mt-5 max-w-xl text-lg text-fg-muted">{content.body}</p>
    </main>
  );
}
