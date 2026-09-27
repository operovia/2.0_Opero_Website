import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { Aurora } from '../aurora';
import { Container, SiteButton } from '../layout-parts';

export function Closing({ content }: { content: SectionData<'home', 'closing'> }) {
  return (
    <section id="book-demo" aria-labelledby="closing-title" className="relative isolate overflow-hidden py-section">
      <Aurora intensity={0.8} className="aurora-bottom" />
      <Container size="3xl" className="text-center">
        <Reveal>
          <h2 id="closing-title" className="text-display-lg font-medium text-metal">
            {content.headline}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mx-auto mt-7 max-w-xl text-lg text-fg-muted sm:text-xl">{content.subhead}</p>
        </Reveal>
        <Reveal delay={0.16}>
          <SiteButton href={content.buttonTarget} size="lg" className="mt-10">
            {content.buttonLabel}
          </SiteButton>
        </Reveal>
      </Container>
    </section>
  );
}
