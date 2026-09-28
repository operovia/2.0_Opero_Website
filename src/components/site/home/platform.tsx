import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { BrandMark } from '@/components/brand/brand-mark';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { Container, SectionIntro } from '../layout-parts';

const jewel = {
  build: 'jewel-build',
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
} as const;

const glow = {
  build: 'module-glow-build',
  studios: 'module-glow-studios',
  playbook: 'module-glow-playbook',
  university: 'module-glow-university',
  compass: 'module-glow-compass',
} as const;

export function Platform({ content }: { content: SectionData<'home', 'platform'> }) {
  return (
    <section id="platform" aria-labelledby="platform-title" className="scroll-mt-18 py-section">
      <Container>
        <SectionIntro headingId="platform-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} />

        <Reveal className="mt-16">
          <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface p-8 sm:p-10">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold text-fg">{content.coreTitle}</h3>
              <p className="mt-3 text-lg text-fg-muted">{content.coreText}</p>
            </div>
          </div>
        </Reveal>

        <RevealGroup as="ul" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.modules.map((item) => (
            <RevealItem as="li" key={item.module}>
              <div className={cn('module-card group relative h-full overflow-hidden rounded-2xl border border-line bg-surface p-6', glow[item.module])}>
                <span aria-hidden className={cn('relative block size-9 rounded-full shadow-md', jewel[item.module])} />
                <h3 className="mt-8">
                  <BrandMark name={`module-${item.module}`} className="h-6" />
                </h3>
                <p className="mt-3 text-sm text-fg-muted">{item.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal>
          <p className="mt-14 text-center text-xl font-medium text-fg sm:text-2xl">{content.closing}</p>
        </Reveal>
      </Container>
    </section>
  );
}
