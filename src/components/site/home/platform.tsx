import { ArrowRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { BrandMark } from '@/components/brand/brand-mark';
import { MODULE_LABELS, TOUR_CORE_KEY, TOUR_CORE_LABEL, TOUR_ID } from '@/content/constants';
import { CORE_SHOT, MODULE_SHOTS } from '@/content/module-shots';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { Container, Eyebrow, SectionIntro } from '../layout-parts';
import { CoreJoin } from './core-join';
import { ModuleLightbox } from './module-lightbox';
import { moduleGlow, moduleJewel } from './module-style';
import { PlatformNetwork } from './platform-network';
import { Tour, type TourItem } from './tour';

/** The lines of a multiline field, blank ones left out. */
const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export function Platform({ content }: { content: SectionData<'home', 'platform'> }) {
  // The tour's screens: the core first, once its screenshot exists, then the modules in the diagram's order. The lightbox shows the same list.
  const core: TourItem[] = CORE_SHOT
    ? [{ key: TOUR_CORE_KEY, label: TOUR_CORE_LABEL, shot: CORE_SHOT, description: '', inside: content.coreInside, video: '' }]
    : [];
  const items: TourItem[] = [
    ...core,
    ...content.modules.map((item) => ({
      key: item.module,
      label: MODULE_LABELS[item.module],
      shot: MODULE_SHOTS[item.module],
      jewel: moduleJewel[item.module],
      description: item.description,
      inside: item.inside,
      video: item.video,
    })),
  ];

  return (
    <section id="platform" aria-labelledby="platform-title" className="scroll-mt-18 py-section">
      <Container>
        <SectionIntro headingId="platform-title" eyebrow={content.eyebrow} headline={content.headline} body={content.body} />

        {/* Opero around everything: the core and every module in one frame, all linked, with Oppie in the middle knowing all of it. */}
        <Reveal className="mt-20">
          <div className="platform-frame">
            <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-strong bg-canvas px-6 py-3 shadow-md">
              <BrandMark name="opero" className="h-7 sm:h-8" />
            </div>

            {/* The core: the records everything is built on, joined to the areas of work they drive. Its label sits on the border. */}
            <div className="relative rounded-2xl border border-line-strong bg-surface p-6 pt-8 sm:p-8 sm:pt-9 lg:p-10">
              <Eyebrow className="absolute top-0 left-6 -translate-y-1/2 bg-surface px-2 sm:left-8 lg:left-10">{content.coreLabel}</Eyebrow>
              <div className="flex flex-col items-center xl:flex-row">
                <div className="relative w-full max-w-56 shrink-0 xl:w-56">
                  <div className="core-place relative rounded-xl bg-canvas-raised p-3">
                    <ul className="space-y-2">
                      {content.coreData.map((record, i) => (
                        <li key={i} className="rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg">
                          {record.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Beside the areas of work, the caption hangs under the stack so the line meets the stack's middle. */}
                  <Eyebrow className="mt-3 text-center xl:absolute xl:inset-x-0 xl:top-full">{content.coreDataLabel}</Eyebrow>
                </div>
                <CoreJoin />
                <ul className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                  {content.coreAreas.map((area, i) => (
                    <li key={i} className="rounded-xl border border-line-strong bg-canvas-raised p-5">
                      <h3 className="text-base font-semibold text-fg">{area.title}</h3>
                      <ul className="mt-3 space-y-1.5">
                        {lines(area.items).map((item, j) => (
                          <li key={j} className="flex gap-2.5 text-sm text-fg-muted">
                            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fg-subtle" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <PlatformNetwork modules={content.modules.map((item) => item.module)} title={content.oppieTitle} detail={content.oppieDetail} />

            {/* Stacked on phones, the cards hang on one line that shows in the gaps between them. */}
            <RevealGroup
              as="ul"
              className="relative isolate grid grid-cols-1 gap-4 max-sm:before:absolute max-sm:before:inset-y-0 max-sm:before:left-1/2 max-sm:before:-z-10 max-sm:before:w-px max-sm:before:bg-fg-subtle/40 sm:grid-cols-2 lg:grid-cols-5"
            >
              {content.modules.map((item) => (
                <RevealItem as="li" key={item.module}>
                  {/* The whole card shows its module in the tour below (tour.tsx takes the press); without JavaScript the link still leads there. */}
                  <a
                    href={`#${TOUR_ID}`}
                    data-tour={item.module}
                    className={cn(
                      'module-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none',
                      moduleGlow[item.module],
                    )}
                  >
                    <span aria-hidden className={cn('relative block size-8 rounded-full shadow-md', moduleJewel[item.module])} />
                    <h3 className="mt-7">
                      <BrandMark name={`module-${item.module}`} className="h-6" />
                    </h3>
                    <p className="mt-3 text-sm text-fg-muted">{item.description}</p>
                    {/* The cue: sighted visitors read it, screen readers hear which module it shows. */}
                    <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-fg">
                      {content.seeItLabel}
                      <span className="sr-only">: {MODULE_LABELS[item.module]}</span>
                      <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </a>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Reveal>

        {/* The tour: every screen large, one tab per module, under the diagram whose cards point at it. */}
        <Reveal className="mt-14 sm:mt-20">
          <Tour items={items} lookInsideLabel={content.lookInsideLabel} />
        </Reveal>
        <ModuleLightbox items={items} />
      </Container>
    </section>
  );
}
