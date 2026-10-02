import Image from 'next/image';
import { BrandMark } from '@/components/brand/brand-mark';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { RichText } from '@/components/rich-text';
import { GO_SCREEN_LABELS } from '@/content/constants';
import { GO_SHOTS } from '@/content/go-shots';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { renderHeadline } from '@/lib/headline';
import { Aurora } from '../aurora';
import { Container, Eyebrow } from '../layout-parts';
import { SiteLink } from '../site-link';

const storeBadge = 'inline-flex h-14 min-w-44 flex-col justify-center rounded-xl border border-line-strong bg-surface px-5 text-left shadow-sm';

/**
 * A store button: a link once the app's page on that store is set in Content,
 * and the same button without a link until then. Text only, so no store's
 * artwork is drawn here; the official badges can take their place later.
 */
function StoreBadge({ href, label, platform }: { href: string; label: string; platform: string }) {
  const inner = (
    <>
      <span className="text-xs text-fg-subtle">{platform}</span>
      <span className="text-base font-semibold text-fg">{label}</span>
    </>
  );
  return href ? (
    <SiteLink href={href} className={cn(storeBadge, 'transition-colors hover:border-fg-subtle hover:bg-surface-raised')}>
      {inner}
    </SiteLink>
  ) : (
    <span className={storeBadge}>{inner}</span>
  );
}

/**
 * OperoGo, the mobile app: the icon and the words, the two stores, the drawn
 * phone screens (scripts/go-shots), and what the app does. The screens stand
 * in a row on wide screens, two by two on tablets, and scroll sideways on
 * phones, snapping one at a time.
 */
export function Go({ content }: { content: SectionData<'home', 'go'> }) {
  return (
    <section id="operogo" aria-labelledby="operogo-title" className="relative scroll-mt-18 overflow-hidden py-section">
      <Aurora intensity={0.6} />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal className="flex justify-center">
            {/* The app icon, the owner's own file; its tile carries its own ground, so it stands the same on both themes. */}
            <BrandMark name="operogo" className="go-icon h-28 rounded-[22%] sm:h-32" />
          </Reveal>
          {content.eyebrow ? (
            <Reveal delay={0.05}>
              <Eyebrow className="mt-8">{content.eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={0.1}>
            <h2 id="operogo-title" className={cn('text-display-md font-medium text-metal', content.eyebrow ? 'mt-5' : 'mt-8')}>
              {renderHeadline(content.headline)}
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <RichText doc={content.body} className="mx-auto mt-7 max-w-2xl text-lg text-fg-muted sm:text-xl" />
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-10 text-sm font-medium text-fg">{content.storesLine}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <StoreBadge href={content.appStoreUrl} label={content.appStoreLabel} platform="iPhone" />
              <StoreBadge href={content.playUrl} label={content.playLabel} platform="Android" />
            </div>
            {content.signInLine ? <p className="mt-4 text-sm text-fg-subtle">{content.signInLine}</p> : null}
          </Reveal>
        </div>

        {/* The phones. On wide screens every other one stands a little lower, so the row reads as a hand of cards rather than a shelf. */}
        <RevealGroup
          as="ul"
          className="go-phones mt-20 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 max-sm:-mx-gutter max-sm:px-gutter sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-6"
          stagger={0.1}
        >
          {content.screens.map((item, index) => (
            <RevealItem
              as="li"
              key={`${item.screen}-${index}`}
              className={cn('w-[72vw] max-w-72 shrink-0 snap-center sm:w-auto sm:max-w-none', index % 2 ? 'lg:mt-10' : '')}
            >
              <div className="go-phone relative rounded-[2.75rem] bg-canvas-raised p-2 shadow-lg">
                <div className="overflow-hidden rounded-[2.25rem] bg-canvas">
                  <Image
                    src={GO_SHOTS[item.screen]}
                    alt={`The ${GO_SCREEN_LABELS[item.screen]} screen of OperoGo.`}
                    sizes="(min-width: 64rem) 16rem, (min-width: 40rem) 40vw, 72vw"
                    quality={85}
                    className="block h-auto w-full"
                  />
                </div>
              </div>
              <p className="mt-5 text-sm font-semibold text-fg">{item.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{item.caption}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <RevealGroup as="ul" className="mt-20 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature, index) => (
            <RevealItem as="li" key={`${feature.title}-${index}`} className="border-t border-line-strong pt-6">
              <h3 className="text-base font-semibold text-fg">{feature.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{feature.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
