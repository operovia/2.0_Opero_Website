import { Reveal } from '@/components/motion/reveal';
import { RichText } from '@/components/rich-text';
import type { SectionData } from '@/content/registry';
import { Container, Eyebrow } from '../layout-parts';
import { OppieOrb } from '../oppie-orb';

export function OppieSection({ content }: { content: SectionData<'home', 'oppie'> }) {
  return (
    <section id="oppie" aria-labelledby="oppie-title" className="relative scroll-mt-18 overflow-hidden border-y border-line bg-canvas-raised py-section">
      <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <Reveal className="flex justify-center py-8">
          <OppieOrb animated />
        </Reveal>
        <div>
          {content.eyebrow ? (
            <Reveal>
              <Eyebrow>{content.eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={0.05}>
            <h2 id="oppie-title" className="text-display-md font-medium text-metal">
              {content.headline}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <RichText doc={content.body} className="mt-7 text-lg text-fg-muted sm:text-xl" />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 border-l-2 border-line-strong pl-5 text-xl font-medium text-fg">{content.closing}</p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
