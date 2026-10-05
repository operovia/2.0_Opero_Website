import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { highlight } from '@/lib/highlight';
import { Container, SectionIntro } from '../layout-parts';
import { StrikeChips } from './strike-chips';

export function Problem({ content }: { content: SectionData<'home', 'problem'> }) {
  return (
    <section aria-labelledby="problem-title" className="py-section">
      <Container>
        <SectionIntro headingId="problem-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} align="center" />
        <StrikeChips items={content.apps.map((a) => a.label)} />
        <Reveal>
          {/* The words the section names in gold, with a light sweeping across them (gold-shimmer in globals.css). */}
          <p className="mx-auto mt-14 max-w-2xl text-center text-xl font-medium text-fg sm:text-2xl">
            {highlight(content.closing, content.closingGold, (words, key) => (
              <span key={key} className="gold-shimmer">
                {words}
              </span>
            ))}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
