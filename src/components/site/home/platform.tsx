import { Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { BrandMark } from '@/components/brand/brand-mark';
import { MODULE_LABELS, MODULE_SHOT, moduleShotPath } from '@/content/constants';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { Container, SectionIntro } from '../layout-parts';
import { ModuleLightbox } from './module-lightbox';
import { PlatformNetwork } from './platform-network';

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

        {/* Opero around everything: the core CRM and every module in one frame, all linked, with Oppie in the middle knowing all of it. */}
        <Reveal className="mt-20">
          <div className="platform-frame">
            <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-strong bg-canvas px-6 py-3 shadow-md">
              <BrandMark name="opero" className="h-7 sm:h-8" />
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface p-8 sm:p-10">
              <div className="mx-auto max-w-2xl text-center">
                <h3 className="text-2xl font-semibold text-fg">{content.coreTitle}</h3>
                <p className="mt-3 text-lg text-fg-muted">{content.coreText}</p>
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
                  <div
                    className={cn(
                      'module-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface p-6',
                      glow[item.module],
                    )}
                  >
                    <span aria-hidden className={cn('relative block size-9 rounded-full shadow-md', jewel[item.module])} />
                    <h3 className="mt-8">
                      <BrandMark name={`module-${item.module}`} className="h-6" />
                    </h3>
                    <p className="mt-3 text-sm text-fg-muted">{item.description}</p>
                    {/* A small view of the screen; it opens full size in the lightbox, or, without JavaScript, as the picture itself. */}
                    <a href={moduleShotPath(item.module)} data-module-shot={item.module} className="group/shot mt-auto block rounded-lg pt-6 outline-none">
                      <span className="block overflow-hidden rounded-lg border border-line-strong bg-canvas-raised shadow-md transition-transform duration-[var(--o-duration-base)] ease-[var(--o-ease-out)] group-hover/shot:-translate-y-0.5 group-focus-visible/shot:ring-2 group-focus-visible/shot:ring-focus-ring group-focus-visible/shot:ring-offset-2 group-focus-visible/shot:ring-offset-surface">
                        <Image
                          src={moduleShotPath(item.module)}
                          alt=""
                          width={MODULE_SHOT.width}
                          height={MODULE_SHOT.height}
                          sizes="(min-width: 64rem) 14rem, (min-width: 40rem) 40vw, 90vw"
                          className="block h-auto w-full"
                        />
                      </span>
                      <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition-colors group-hover/shot:text-fg group-focus-visible/shot:text-fg">
                        <Maximize2 className="size-3.5" aria-hidden />
                        {content.lookInsideLabel}
                        <span className="sr-only">: {MODULE_LABELS[item.module]}</span>
                      </span>
                    </a>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Reveal>
        <ModuleLightbox modules={content.modules} heading={content.insideHeading} />
      </Container>
    </section>
  );
}
