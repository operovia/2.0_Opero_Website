import { RevealGroup, RevealItem } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { Container, SectionIntro } from '../layout-parts';

export function Proof({ content }: { content: SectionData<'home', 'proof'> }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className="scroll-mt-18 py-section">
      <Container>
        <SectionIntro headingId="proof-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} />
        <RevealGroup as="ul" className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
          {content.stats.map((stat) => (
            <RevealItem as="li" key={stat.value + stat.label} className="border-t border-line-strong pt-6">
              <p className="text-display-md font-medium text-metal">{stat.value}</p>
              <p className="mt-2 text-base text-fg-muted">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
