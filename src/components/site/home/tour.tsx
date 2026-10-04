'use client';

import { Pause, Play } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { TOUR_ID, type TourKey } from '@/content/constants';
import { cn } from '@/lib/cn';
import { iconButton } from './lightbox';

/** One screen of the tour: a module's, or the core CRM's once its screenshot exists. The lightbox shows the same list. */
export type TourItem = {
  key: TourKey;
  /** The screen's name: the module's, or Core. */
  label: string;
  shot: StaticImageData;
  /** The jewel-* class of the dot on its tab; the core has no jewel. */
  jewel?: string;
  /** The caption's lead, the module's description from its card; empty for the core. */
  description: string;
  /** The caption: what the person is looking at. */
  inside: string;
  /** A screen recording to play in the screenshot's place, or empty. */
  video: string;
};

type Props = { items: TourItem[]; lookInsideLabel: string };

const focusRing = 'focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none';

/** How the page and the rows move: at once for a visitor who prefers reduced motion. */
const behavior = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/** Scrolls `scroller` sideways until `child` stands in its middle. One with nothing to scroll is left alone. */
function centerIn(scroller: HTMLElement | null, child: Element | null | undefined): void {
  if (!scroller || !(child instanceof HTMLElement) || scroller.scrollWidth <= scroller.clientWidth) return;
  scroller.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - scroller.clientWidth / 2, behavior: behavior() });
}

/**
 * The product tour under the platform diagram: one tab per screen, in the
 * diagram's order, and the chosen screen large with its caption. Pressing a
 * screen opens it in the lightbox (module-lightbox.tsx, through the link's
 * data-module-shot). A module card in the diagram (a link with data-tour)
 * selects its tab and brings the tour into view.
 *
 * The tabs follow the WAI-ARIA tabs pattern: the arrow keys, Home and End
 * move between them, and the chosen tab is the one in the tab order. From
 * sm only the chosen panel shows. On phones every panel stands in a row that
 * scrolls sideways and snaps, as the OperoGo phones do; a swipe selects the
 * tab of the panel it settles on, and a tab scrolls the row to its panel.
 *
 * Each panel's picture is fetched when its tab is chosen, hovered or
 * focused, so a switch shows the picture at once; the first is fetched
 * with the page.
 */
export function Tour({ items, lookInsideLabel }: Props) {
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState<Partial<Record<TourKey, true>>>({});
  const section = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = items.length;

  const warmUp = (key: TourKey) => setWarm((known) => (known[key] ? known : { ...known, [key]: true }));

  /** Shows one screen: its tab chosen (and focused, when asked) and, where the tabs or the panels scroll sideways, in the middle. */
  const select = useCallback((index: number, focus = false) => {
    setActive(index);
    const tab = tabs.current[index];
    if (focus) tab?.focus({ preventScroll: true });
    centerIn(list.current, tab);
    centerIn(row.current, row.current?.children[index]);
  }, []);

  // A module card in the diagram selects its screen and brings the tour into view.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-tour]');
      if (!link) return;
      const index = items.findIndex((item) => item.key === link.getAttribute('data-tour'));
      if (index === -1) return;
      event.preventDefault();
      select(index, true);
      section.current?.scrollIntoView({ behavior: behavior(), block: 'start' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [items, select]);

  // On phones, a swipe through the row selects the tab of the panel it settles on.
  useEffect(() => {
    const scroller = row.current;
    if (!scroller) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (scroller.scrollWidth <= scroller.clientWidth) return;
        const middle = scroller.scrollLeft + scroller.clientWidth / 2;
        let nearest = 0;
        let distance = Infinity;
        Array.from(scroller.children).forEach((child, index) => {
          if (!(child instanceof HTMLElement)) return;
          const gap = Math.abs(child.offsetLeft + child.offsetWidth / 2 - middle);
          if (gap < distance) {
            distance = gap;
            nearest = index;
          }
        });
        setActive(nearest);
        centerIn(list.current, tabs.current[nearest]);
      }, 120);
    };
    scroller.addEventListener('scroll', settle, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', settle);
      clearTimeout(timer);
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const moves: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(((next % count) + count) % count, true);
  }

  if (!count) return null;

  return (
    <div ref={section} id={TOUR_ID} className="mx-auto max-w-5xl scroll-mt-24">
      {/* On phones the tabs scroll sideways in one line; from sm they stand centered on as many lines as they need. */}
      <div
        ref={list}
        role="tablist"
        aria-label="Modules"
        onKeyDown={onKeyDown}
        className="swipe-row relative -mx-gutter flex gap-1 overflow-x-auto px-gutter sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      >
        {items.map((item, index) => {
          const chosen = index === active;
          return (
            <button
              key={item.key}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`tour-tab-${item.key}`}
              aria-selected={chosen}
              aria-controls={`tour-panel-${item.key}`}
              tabIndex={chosen ? 0 : -1}
              onClick={() => select(index)}
              onPointerEnter={() => warmUp(item.key)}
              onFocus={() => warmUp(item.key)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                chosen ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:text-fg',
                focusRing,
              )}
            >
              {item.jewel ? <span aria-hidden className={cn('size-2 rounded-full', item.jewel)} /> : null}
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        ref={row}
        className="swipe-row relative mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 max-sm:-mx-gutter max-sm:px-gutter sm:mt-8 sm:block sm:overflow-visible sm:pb-0"
      >
        {items.map((item, index) => {
          const chosen = index === active;
          return (
            <div
              key={item.key}
              role="tabpanel"
              id={`tour-panel-${item.key}`}
              aria-labelledby={`tour-tab-${item.key}`}
              className={cn('w-[86vw] shrink-0 snap-center sm:w-auto', !chosen && 'sm:hidden')}
            >
              <figure className="m-0">
                {item.video ? (
                  <TourVideo item={item} shown={chosen} />
                ) : (
                  /* A link to the picture itself, which the lightbox opens in its place. */
                  <a
                    href={item.shot.src}
                    data-module-shot={item.key}
                    title={lookInsideLabel}
                    className={cn('block cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-canvas-raised', focusRing)}
                  >
                    <Image
                      src={item.shot}
                      alt={`A screen from ${item.label}.`}
                      sizes="(min-width: 72rem) 64rem, (min-width: 40rem) calc(100vw - 5rem), 86vw"
                      quality={85}
                      loading={chosen || warm[item.key] ? 'eager' : 'lazy'}
                      className="block h-auto w-full"
                    />
                    <span className="sr-only">{lookInsideLabel}: </span>
                  </a>
                )}
                <figcaption className="mt-4 text-sm text-fg-muted sm:text-base">
                  {item.description ? <span className="font-medium text-fg">{item.description} </span> : null}
                  {item.inside}
                </figcaption>
                {item.video ? (
                  <a
                    href={item.shot.src}
                    data-module-shot={item.key}
                    className={cn(
                      'mt-4 inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-raised',
                      focusRing,
                    )}
                  >
                    {lookInsideLabel}
                    <span className="sr-only">: {item.label}</span>
                  </a>
                ) : null}
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A screen recording in the screenshot's place: muted, looping, playing by
 * itself while its panel is shown and on screen, except for a visitor who
 * prefers reduced motion, who presses play. The button pauses it, and the
 * screenshot is its first frame. The lightbox still shows the screenshot,
 * from the Look inside link under the caption.
 */
function TourVideo({ item, shown }: { item: TourItem; shown: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // What the visitor asked for, or nothing yet.
  const [wanted, setWanted] = useState<'auto' | 'play' | 'pause'>('auto');

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const byItself = wanted === 'auto' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!shown || !(byItself || wanted === 'play')) {
      element.pause();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void element.play().catch(() => undefined);
        else element.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.pause();
    };
  }, [shown, wanted]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-canvas-raised">
      <video
        ref={video}
        src={item.video}
        poster={item.shot.src}
        width={item.shot.width}
        height={item.shot.height}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block h-auto w-full"
      >
        <span className="sr-only">A screen from {item.label}.</span>
      </video>
      <button type="button" onClick={() => setWanted(playing ? 'pause' : 'play')} className={cn(iconButton, 'absolute right-3 bottom-3 shadow-md', focusRing)}>
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        <span className="sr-only">{playing ? 'Pause' : 'Play'}</span>
      </button>
    </div>
  );
}
