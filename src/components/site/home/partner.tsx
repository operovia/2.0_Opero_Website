import { Reveal } from '@/components/motion/reveal';
import { RichText } from '@/components/rich-text';
import type { SectionData } from '@/content/registry';
import { renderHeadline } from '@/lib/headline';
import { Container, Eyebrow, SiteButton } from '../layout-parts';

export function PartnerInvite({ content }: { content: SectionData<'home', 'partner'> }) {
  return (
    <section aria-labelledby="partner-title" className="py-section">
      <Container>
        <Reveal>
          <div className="partner-frame relative isolate overflow-hidden rounded-2xl p-px">
            <div className="relative rounded-[calc(var(--o-radius-2xl)-1px)] bg-surface px-6 py-16 text-center sm:px-12 md:py-20">
              {content.eyebrow ? <Eyebrow>{content.eyebrow}</Eyebrow> : null}
              <h2 id="partner-title" className="mx-auto mt-5 max-w-3xl text-display-md font-medium text-metal">
                {renderHeadline(content.headline)}
              </h2>
              <RichText doc={content.body} className="mx-auto mt-7 max-w-2xl text-lg text-fg-muted" />
              <p className="mt-8 text-eyebrow font-semibold text-fg-subtle uppercase">{content.closing}</p>
              <SiteButton href={content.buttonTarget} size="lg" className="mt-8">
                {content.buttonLabel}
              </SiteButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
