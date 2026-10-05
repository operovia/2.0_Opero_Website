import { RevealGroup, RevealItem } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { Container, SectionIntro } from '../layout-parts';

/** On wide screens up to four stats stand in one row; five or six, in rows of three. Tablets show two to a row, phones one. */
const wideColumns: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

export function Proof({ content }: { content: SectionData<'home', 'proof'> }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className="scroll-mt-18 py-section">
      <Container>
        <SectionIntro headingId="proof-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} />
        <RevealGroup as="ul" className={cn('mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2', wideColumns[content.stats.length] ?? 'lg:grid-cols-3')}>
          {content.stats.map((stat) => (
            <RevealItem as="li" key={stat.value + stat.label} className="border-t border-line-strong pt-6">
              {/* The figure in gold, with a light sweeping across it as across the hero's (gold-shimmer in globals.css), one after another in reading order. */}
              <p className="text-3xl font-medium text-balance text-metal xl:text-display-sm">
                <span className="gold-shimmer">{stat.value}</span>
              </p>
              <p className="mt-2 text-base text-fg-muted">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
