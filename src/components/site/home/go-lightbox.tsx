'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { GO_SCREEN_LABELS, type GoScreenName } from '@/content/constants';
import { GO_SHOTS } from '@/content/go-shots';
import { cn } from '@/lib/cn';
import { closeButton as closeButtonClass, iconButton, OUT, pillButton, useZoom } from './lightbox';
import { PhoneFrame } from './phone-frame';

export type GoShot = { screen: GoScreenName; title: string; caption: string };

/** The screens were drawn at three device pixels to the CSS pixel (scripts/go-shots/render.mjs). */
const DRAWN_SCALE = 3;

/**
 * The OperoGo screens one at a time, in a native modal dialog: a phone on the
 * page (a link with data-go-shot, its place in the row) opens it on that
 * screen, in the same iPhone, as large as the window allows. The arrows, the
 * dots and the keyboard move between screens, Escape closes, and focus goes
 * back to the phone. The links point at the image files, so without
 * JavaScript they still show the picture.
 *
 * The phone takes the window's height, and the title and caption stand beside
 * it on wide windows and under it on narrow ones. Zooming works as on the
 * module screenshots (useZoom in lightbox.ts): the magnifying glass, or a
 * click or tap on the screen, looks closer, and the screen's own rounded
 * corners frame the close look.
 */
export function GoLightbox({ screens }: { screens: GoShot[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  // Once opened, every screen is fetched, so moving between them is instant.
  const [opened, setOpened] = useState(false);
  const current = screens[active];
  const frame = useRef<HTMLDivElement>(null);
  const zoomer = useZoom(frame, current ? GO_SHOTS[current.screen].width / DRAWN_SCALE : 0);
  const { zoom, setZoom } = zoomer;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-go-shot]');
      if (!link) return;
      const index = Number(link.getAttribute('data-go-shot'));
      if (!Number.isInteger(index) || !screens[index]) return;
      event.preventDefault();
      setActive(index);
      setZoom(OUT);
      setOpened(true);
      if (!dialog.current?.open) dialog.current?.showModal();
      closeButton.current?.focus();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [screens, setZoom]);

  const count = screens.length;
  if (!current) return null;
  const previous = screens[(active - 1 + count) % count]!;
  const next = screens[(active + 1) % count]!;

  function show(index: number): void {
    setActive((index + count) % count);
    setZoom(OUT);
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="go-shot-title"
      aria-describedby="go-shot-caption"
      onKeyDown={(event) => {
        if (zoomer.onKey(event) || count < 2) return;
        if (event.key === 'ArrowRight') show(active + 1);
        if (event.key === 'ArrowLeft') show(active - 1);
      }}
      // Escape zooms out first, then closes.
      onCancel={zoomer.onCancel}
      onClose={() => setZoom(OUT)}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="go-dialog m-auto rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay"
    >
      <div className="flex h-full flex-col">
        <div className="relative flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-5 sm:px-6">
          {/* The OperoGo icon is the heading; screen readers hear the screen's name with it. */}
          <h2 id="go-shot-title" className="flex min-w-0 items-center">
            <BrandMark name="operogo" decorative className="size-9" />
            <span className="sr-only">OperoGo: {current.title}</span>
          </h2>
          {count > 1 ? (
            <ol className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" aria-label="Screens">
              {screens.map((item, index) => (
                <li key={`${item.screen}-${index}`}>
                  <button
                    type="button"
                    onClick={() => show(index)}
                    aria-current={index === active ? 'true' : undefined}
                    className={cn('block size-2.5 rounded-full transition-colors', index === active ? 'bg-fg' : 'bg-fg-subtle/50 hover:bg-fg-muted')}
                  >
                    <span className="sr-only">{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="flex items-center gap-2">
            <button type="button" onClick={zoomer.toggle} className={pillButton}>
              {zoom.on ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
              <span className="max-sm:sr-only">{zoom.on ? 'Zoom out' : 'Zoom in'}</span>
            </button>
            <button ref={closeButton} type="button" onClick={() => dialog.current?.close()} className={closeButtonClass}>
              <X className="size-5" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_18rem] md:grid-rows-1">
          {/* The slot the phone fits into, at its own proportions (globals.css, .go-shot-slot). */}
          <figure className="go-shot-slot m-0 grid min-h-0 min-w-0 place-items-center p-4 md:p-6">
            <PhoneFrame
              screen={{
                ref: frame,
                className: cn('zoom-frame select-none', zoomer.frameClass),
                'aria-live': 'polite',
                ...zoomer.frameProps,
              }}
            >
              {opened
                ? screens.map((item, index) => {
                    const shown = index === active;
                    const zoomed = shown && zoom.on;
                    return (
                      <Image
                        key={`${item.screen}-${index}`}
                        src={GO_SHOTS[item.screen]}
                        alt={`The ${GO_SCREEN_LABELS[item.screen]} screen of OperoGo.`}
                        sizes={zoomer.sizes(zoomed)}
                        quality={85}
                        priority={shown}
                        draggable={false}
                        className={cn('absolute inset-0 h-full w-full origin-top-left object-cover', shown ? '' : 'invisible')}
                        style={zoomer.style(zoomed)}
                      />
                    );
                  })
                : null}
            </PhoneFrame>
          </figure>

          {/* Under the phone: the arrows either side of the words. Beside it, on wide windows: the words, then the arrows at the foot. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-4 py-3 sm:px-6 md:flex md:flex-col md:items-stretch md:justify-between md:gap-6 md:border-t-0 md:border-l md:p-6">
            <div id="go-shot-caption" className="col-start-2 row-start-1 text-center md:text-left">
              <p className="text-sm font-semibold text-fg md:text-lg">{current.title}</p>
              <p className="mt-1 text-sm text-fg-muted md:mt-2 md:text-base">{current.caption}</p>
            </div>
            {count > 1 ? (
              <div className="contents md:flex md:gap-2">
                <button type="button" onClick={() => show(active - 1)} title={previous.title} className={cn(iconButton, 'col-start-1 row-start-1')}>
                  <ChevronLeft className="size-4" aria-hidden />
                  <span className="sr-only">Previous screen: {previous.title}</span>
                </button>
                <button type="button" onClick={() => show(active + 1)} title={next.title} className={cn(iconButton, 'col-start-3 row-start-1')}>
                  <ChevronRight className="size-4" aria-hidden />
                  <span className="sr-only">Next screen: {next.title}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
