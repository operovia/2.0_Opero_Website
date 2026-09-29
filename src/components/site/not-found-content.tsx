import type { SectionData } from '@/content/registry';
import { renderHeadline } from '@/lib/headline';
import { Aurora } from './aurora';
import { Container, Eyebrow, SiteButton } from './layout-parts';

/** The page-not-found message, inside whichever page frame shows it. */
export function NotFoundContent({ content }: { content: SectionData<'site', 'notFound'> }) {
  return (
    <div className="relative isolate overflow-hidden">
      <Aurora intensity={0.6} />
      <Container className="flex min-h-[60dvh] flex-col items-center justify-center py-section text-center">
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-5 max-w-2xl text-display-md font-medium text-metal">{renderHeadline(content.headline)}</h1>
        <p className="mt-6 max-w-xl text-lg text-fg-muted">{content.body}</p>
        <SiteButton href="/" size="lg" className="mt-10">
          {content.buttonLabel}
        </SiteButton>
      </Container>
    </div>
  );
}
