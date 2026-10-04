'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { cn } from '@/lib/cn';
import { ShotImage } from '../shot-image';
import { closeButton as closeButtonClass, OUT, pillButton, useZoom } from './lightbox';
import type { TourItem } from './tour';

type Props = { items: TourItem[] };

/**
 * The tour's screens large, in one native modal dialog: a link with
 * data-module-shot (the tour's pictures) opens it on that screen, the arrows,
 * the dots and the keyboard move between screens, Escape closes. The links point at the image
 * files themselves, so without JavaScript they still show the picture. The
 * dialog traps focus and returns it to the link afterwards.
 *
 * The picture takes as much of the screen as it can: on wide, short screens
 * (most laptops) the caption and the arrows stand beside it rather than under
 * it. The magnifying glass, or a click or tap on the picture, zooms in: the
 * picture then follows the mouse across the frame, or the finger as it drags,
 * or the arrow keys; another click, the magnifying glass or Escape zooms out
 * (useZoom in lightbox.ts, shared with the OperoGo screens).
 */
export function ModuleLightbox({ items }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  // Once opened, every screenshot is fetched, so moving between modules is instant.
  const [opened, setOpened] = useState(false);
  const current = items[active];
  const frame = useRef<HTMLDivElement>(null);
  const zoomer = useZoom(frame, current ? current.shot.original.width / 2 : 0);
  const { zoom, setZoom } = zoomer;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-module-shot]');
      if (!link) return;
      const index = items.findIndex((item) => item.key === link.getAttribute('data-module-shot'));
      if (index === -1) return;
      event.preventDefault();
      setActive(index);
      setZoom(OUT);
      setOpened(true);
      if (!dialog.current?.open) dialog.current?.showModal();
      closeButton.current?.focus();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [items, setZoom]);

  const count = items.length;
  if (!current) return null;

  function show(index: number): void {
    setActive((index + count) % count);
    setZoom(OUT);
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="module-shot-title"
      aria-describedby="module-shot-caption"
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
      // As wide as the screen allows, and no wider than lets the whole picture and what goes with it fit the height: under the picture, the
      // caption and the arrows take about 10rem with the top bar; beside it, on wide short screens, the top bar alone takes 4.5rem and the
      // column 20rem of the width. Never wider than the size the screens were drawn at (90rem).
      className="module-dialog m-auto w-[min(calc(100%-2*var(--o-gutter)),90rem,calc((100dvh-2*var(--o-gutter)-10rem)*1.6))] rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay shot-wide:w-[min(calc(100%-2*var(--o-gutter)),110rem,calc((100dvh-2*var(--o-gutter)-4.5rem)*1.6+20rem))]"
    >
      <div className="relative flex max-h-[calc(100dvh-2*var(--o-gutter))] flex-col overflow-y-auto">
        <div className="relative flex items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-6">
          {/* The Opero logo is the heading. Sighted visitors read the module's name in the picture itself; screen readers hear it here. */}
          <h2 id="module-shot-title" className="flex min-w-0 items-center">
            <BrandMark name="opero" decorative className="h-7 sm:h-8" />
            <span className="sr-only">{current.label}</span>
          </h2>
          {count > 1 ? (
            <ol className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" aria-label="Modules">
              {items.map((item, index) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => show(index)}
                    aria-current={index === active ? 'true' : undefined}
                    className={cn('block size-2.5 rounded-full transition-colors', index === active ? 'bg-fg' : 'bg-fg-subtle/50 hover:bg-fg-muted')}
                  >
                    <span className="sr-only">{item.label}</span>
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

        <div className="flex flex-col shot-wide:grid shot-wide:grid-cols-[minmax(0,1fr)_20rem]">
          <figure className="m-0">
            <div
              ref={frame}
              className={cn('zoom-frame relative aspect-[16/10] w-full overflow-hidden bg-canvas-raised select-none', zoomer.frameClass)}
              aria-live="polite"
              {...zoomer.frameProps}
            >
              {opened
                ? items.map((item, index) => {
                    const shown = index === active;
                    const zoomed = shown && zoom.on;
                    return (
                      <ShotImage
                        key={item.key}
                        set={item.shot}
                        alt={`A screen from ${item.label}.`}
                        sizes={zoomer.sizes(zoomed)}
                        loading="eager"
                        draggable={false}
                        className={cn('absolute inset-0 h-full w-full origin-top-left object-cover', shown ? '' : 'invisible')}
                        style={zoomer.style(zoomed)}
                      />
                    );
                  })
                : null}
            </div>
          </figure>

          {/* Under the picture: the arrows either side of the caption. Beside it, on wide short screens: the caption, then the arrows at the foot. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-5 py-3 sm:px-6 shot-wide:grid-cols-2 shot-wide:grid-rows-[minmax(0,1fr)_auto] shot-wide:items-start shot-wide:gap-y-6 shot-wide:border-t-0 shot-wide:border-l shot-wide:p-6">
            <p
              id="module-shot-caption"
              className="col-start-2 row-start-1 text-center text-sm text-fg-muted shot-wide:col-span-2 shot-wide:col-start-1 shot-wide:text-left shot-wide:text-base"
            >
              {current.description ? <span className="font-medium text-fg">{current.description} </span> : null}
              {current.inside}
            </p>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => show(active - 1)}
                  className={cn(pillButton, 'col-start-1 row-start-1 shot-wide:row-start-2 shot-wide:justify-self-start')}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  <span>
                    <span className="sr-only">Previous module: </span>
                    <span className="max-sm:sr-only">{items[(active - 1 + count) % count]!.label}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => show(active + 1)}
                  className={cn(pillButton, 'col-start-3 row-start-1 shot-wide:col-start-2 shot-wide:row-start-2 shot-wide:justify-self-end')}
                >
                  <span>
                    <span className="sr-only">Next module: </span>
                    <span className="max-sm:sr-only">{items[(active + 1) % count]!.label}</span>
                  </span>
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
