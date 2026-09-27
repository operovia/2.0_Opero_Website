import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { Container, SectionIntro } from '../layout-parts';
import { StrikeChips } from './strike-chips';

export function Problem({ content }: { content: SectionData<'home', 'problem'> }) {
  return (
    <section aria-labelledby="problem-title" className="py-section">
      <Container>
        <SectionIntro headingId="problem-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} align="center" />
        <StrikeChips items={content.apps.map((a) => a.label)} />
        <Reveal>
          <p className="mx-auto mt-14 max-w-2xl text-center text-xl font-medium text-fg sm:text-2xl">{content.closing}</p>
        </Reveal>
      </Container>
    </section>
  );
}
