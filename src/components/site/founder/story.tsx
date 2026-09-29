import { BrandMark } from '@/components/brand/brand-mark';
import { Reveal } from '@/components/motion/reveal';
import { AppCloud, StoryLine } from '@/components/site/investors/story-visuals';
import { Container } from '@/components/site/layout-parts';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';

/** The dots where each column meets the line across the story: gray at the problem, a jewel at the solution. */
const nodes = ['bg-line-strong', 'jewel-build'];

/**
 * The founder's story in two columns across a line: the problem, over a cloud
 * of disconnected apps, and the solution, under the Opero mark. Shown on the
 * Investor Hub and the public Founder page.
 */
export function FounderStory({ story }: { story: SectionData<'investors', 'story'> }) {
  const steps = [
    { picture: <AppCloud className="h-full w-full max-w-md" />, title: story.problemTitle, body: story.problemBody },
    { picture: <BrandMark name="opero" className="h-16 sm:h-20" decorative />, title: story.solutionTitle, body: story.solutionBody },
  ];

  return (
    <section className="pb-section">
      <Container>
        <div className="relative">
          <StoryLine className="absolute inset-x-0 top-1.5 hidden md:block" />
          <ol className="grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-16">
            {steps.map((step, i) => (
              <li key={i}>
                <Reveal delay={i * 0.12}>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className={cn('relative size-3 rounded-full ring-4 ring-canvas', nodes[i])} />
                    <span aria-hidden className="text-eyebrow font-semibold text-fg-subtle tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-8 flex h-44 items-center">{step.picture}</div>
                  <h2 className="mt-6 text-xl font-semibold text-fg">{step.title}</h2>
                  <p className="mt-3 max-w-md text-base text-fg-muted">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
