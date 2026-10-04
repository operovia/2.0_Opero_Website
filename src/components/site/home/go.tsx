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
import { GoLightbox } from './go-lightbox';
import { PhoneFrame } from './phone-frame';
import { SwipeRow } from './swipe-row';

const storeBadge = 'inline-flex h-14 min-w-44 flex-col justify-center rounded-xl border border-line-strong bg-surface px-5 text-left shadow-sm';

/**
 * A store button: a link to the app's page on that store, shown only once
 * that page is set in Content. In words, so no store's artwork is drawn
 * here; the stores' official badges can take the words' place once the
 * owner supplies them.
 */
function StoreBadge({ href, label, platform }: { href: string; label: string; platform: string }) {
  return (
    <SiteLink href={href} className={cn(storeBadge, 'transition-colors hover:border-fg-subtle hover:bg-surface-raised')}>
      <span className="text-xs text-fg-subtle">{platform}</span>
      <span className="text-base font-semibold text-fg">{label}</span>
    </SiteLink>
  );
}

/**
 * OperoGo, the mobile app: the icon and the words, the stores (or, until the app is listed, the Coming soon line), the drawn
 * phone screens (scripts/go-shots) in iPhones, and what the app does. The
 * phones stand in a row on wide screens, two by two on tablets, and scroll
 * sideways on phones, snapping one at a time; the features do the same. Pressing a phone opens its
 * screen large in the lightbox, where it can be zoomed.
 */
export function Go({ content }: { content: SectionData<'home', 'go'> }) {
  // Until the app is listed on a store, a plain line stands where the buttons will: nothing looks pressable that is not.
  const listed = Boolean(content.appStoreUrl || content.playUrl);
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
            {listed ? (
              <>
                <p className="mt-10 text-sm font-medium text-fg">{content.storesLine}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {content.appStoreUrl ? <StoreBadge href={content.appStoreUrl} label={content.appStoreLabel} platform="iPhone" /> : null}
                  {content.playUrl ? <StoreBadge href={content.playUrl} label={content.playLabel} platform="Android" /> : null}
                </div>
              </>
            ) : (
              <p data-testid="go-coming-soon" className="mt-10 text-sm font-medium text-fg">
                {content.comingSoonLine}
              </p>
            )}
            {content.signInLine ? <p className="mt-4 text-sm text-fg-subtle">{content.signInLine}</p> : null}
          </Reveal>
        </div>

        {/* The phones. On wide screens every other one stands a little lower, so the row reads as a hand of cards rather than a shelf. */}
        <RevealGroup
          as="ul"
          className="swipe-row mt-20 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 max-sm:-mx-gutter max-sm:px-gutter sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-6"
          stagger={0.1}
        >
          {content.screens.map((item, index) => (
            <RevealItem
              as="li"
              key={`${item.screen}-${index}`}
              className={cn('w-[72vw] max-w-72 shrink-0 snap-center sm:w-auto sm:max-w-none', index % 2 ? 'lg:mt-10' : '')}
            >
              {/* A link to the picture itself, which the lightbox opens in its place (go-lightbox.tsx). */}
              <a href={GO_SHOTS[item.screen].src} data-go-shot={index} title={content.lookCloserLabel} className="phone-link cursor-zoom-in">
                <span className="sr-only">{content.lookCloserLabel}: </span>
                <PhoneFrame>
                  <Image
                    src={GO_SHOTS[item.screen]}
                    alt={`The ${GO_SCREEN_LABELS[item.screen]} screen of OperoGo.`}
                    sizes="(min-width: 64rem) 16rem, (min-width: 40rem) 40vw, 72vw"
                    quality={85}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </PhoneFrame>
              </a>
              <p className="mt-5 text-sm font-semibold text-fg">{item.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{item.caption}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* On phones the features stand in a row that scrolls sideways; from sm they take a grid. */}
        <SwipeRow className="mt-20">
          <RevealGroup as="ul" className="flex gap-6 max-sm:w-max sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
            {content.features.map((feature, index) => (
              <RevealItem
                as="li"
                key={`${feature.title}-${index}`}
                className="w-[72vw] max-w-72 shrink-0 snap-center border-t border-line-strong pt-6 sm:w-auto sm:max-w-none"
              >
                <h3 className="text-base font-semibold text-fg">{feature.title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{feature.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </SwipeRow>
      </Container>
      <GoLightbox screens={content.screens} />
    </section>
  );
}
