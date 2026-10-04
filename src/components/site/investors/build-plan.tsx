import { ArrowUpRight, Check, CircleDashed } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { renderHeadline } from '@/lib/headline';

/** The items in a one-per-line list from the admin. */
const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

type Props = {
  /** The two sides, named once: what is in production, and what the raise builds. */
  next: SectionData<'investors', 'next'>;
  /** The areas, each with what runs today, what runs today and grows in the new build, and what is new. */
  platform: SectionData<'investors', 'platform'>;
};

const columns = 'md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)]';
const tag = 'ml-1 inline-block rounded-full border border-line-strong px-1.5 align-middle text-micro font-semibold text-fg-subtle uppercase';

/**
 * What runs today against what the raise builds, area by area, in two
 * columns: on the left everything in production at the flagship operator,
 * on the right what the new build adds. A capability that runs today and
 * grows in the new build stands on the right with the extended tag, and the
 * line under the table says what the tag means. The two cards above name
 * the sides once.
 */
export function BuildPlan({ next, platform }: Props) {
  const areas = platform.areas.map((area) => ({ name: area.name, today: lines(area.today), extended: lines(area.extended), next: lines(area.next) }));
  const anyExtended = areas.some((area) => area.extended.length > 0);

  return (
    <section aria-labelledby="plan-title" className="border-t border-line bg-canvas-raised py-section">
      <Container>
        <Reveal>
          <Eyebrow>{next.heading}</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 id="plan-title" className="mt-5 max-w-3xl text-display-sm font-medium text-metal">
            {renderHeadline(platform.headline)}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-2xl text-lg text-fg-muted">{platform.intro}</p>
        </Reveal>

        {/* The two sides. */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Reveal className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="flex items-center gap-2.5 text-micro font-semibold text-fg-subtle uppercase">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              {next.todayLabel}
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-fg">{next.todayTitle}</h3>
            <p className="mt-2 text-base text-fg-muted">{next.todayBody}</p>
          </Reveal>
          <Reveal delay={0.1} className="investor-blueprint rounded-2xl border border-dashed border-line-strong p-6 sm:p-8">
            <p className="flex items-center gap-2.5 text-micro font-semibold text-fg-subtle uppercase">
              <span aria-hidden className="size-2 rounded-full border border-fg-subtle" />
              {next.nextLabel}
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-fg">{next.nextTitle}</h3>
            <p className="mt-2 text-base text-fg-muted">{next.nextBody}</p>
          </Reveal>
        </div>

        {/* Area by area: the name, then the two columns. On phones each column carries its own label. */}
        <Reveal className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className={cn('hidden gap-6 border-b border-line px-6 py-3 text-micro font-semibold text-fg-subtle uppercase md:grid', columns)}>
              <span />
              <span className="flex items-center gap-2">
                <Check aria-hidden className="size-3.5 text-success" />
                {platform.todayLabel}
              </span>
              <span className="flex items-center gap-2">
                <CircleDashed aria-hidden className="size-3.5" />
                {platform.nextLabel}
              </span>
            </div>
            <ul>
              {areas.map((area, i) => {
                const builds = [...area.next.map((item) => ({ item, extended: false })), ...area.extended.map((item) => ({ item, extended: true }))];
                return (
                  <li key={area.name + i} className={cn('grid grid-cols-1 gap-4 border-b border-line px-6 py-6 last:border-b-0 md:gap-6', columns)}>
                    <h3 className="text-base font-semibold text-fg">{area.name}</h3>
                    <div>
                      {area.today.length ? (
                        <>
                          <p className="text-micro font-semibold text-fg-subtle uppercase md:sr-only">{platform.todayLabel}</p>
                          <ul className="mt-2 space-y-2 md:mt-0">
                            {area.today.map((item) => (
                              <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                    <div>
                      {builds.length ? (
                        <>
                          <p className="text-micro font-semibold text-fg-subtle uppercase md:sr-only">{platform.nextLabel}</p>
                          <ul className="mt-2 space-y-2 md:mt-0">
                            {builds.map(({ item, extended }) => (
                              <li key={item} className="flex gap-2.5 text-sm text-fg">
                                {extended ? (
                                  <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                                ) : (
                                  <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                                )}
                                <span>
                                  {item}
                                  {extended ? <span className={tag}>{platform.extendedLabel}</span> : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {anyExtended ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              <ArrowUpRight aria-hidden className="size-4 text-success" />
              <span className={cn(tag, 'ml-0')}>{platform.extendedLabel}</span>
              {platform.extendedNote}
            </p>
          ) : null}
        </Reveal>
      </Container>
    </section>
  );
}
