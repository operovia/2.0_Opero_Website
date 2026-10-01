'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { MODULE_LABELS, type ModuleName } from '@/content/constants';
import { MODULE_SHOTS } from '@/content/module-shots';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

export type ModuleShot = { module: ModuleName; description: string; inside: string };

type Props = { modules: ModuleShot[] };

/** On phones the buttons are round, with only the icon showing: the words would not fit. Screen readers hear the words everywhere. */
const pillButton =
  'inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-line-input hover:bg-surface-raised disabled:pointer-events-none disabled:opacity-40 max-sm:w-10 max-sm:justify-center max-sm:gap-0 max-sm:px-0';

/**
 * Where a zoomed picture is looking: the point of the picture, as shares of
 * its width and height, that shows at the same share of the frame. Moving the
 * pointer across the frame therefore moves across the whole picture.
 */
type Zoom = { on: boolean; x: number; y: number };
const OUT: Zoom = { on: false, x: 0.5, y: 0.5 };
const clamp = (n: number) => Math.min(1, Math.max(0, n));
/** How far one arrow key moves a zoomed picture, as a share of the way across. */
const STEP = 0.1;
/** A press that moves less than this before it lets go is a click or a tap, not a drag. */
const TAP_PX = 6;
/** Zoomed, a picture shows at least twice its fitted size, and at least the size it was drawn at, which is its own width in CSS pixels; never more than four times. */
const zoomFactor = (drawnWidth: number, frameWidth: number) => (frameWidth ? Math.min(4, Math.max(2, drawnWidth / frameWidth)) : 2);

/**
 * The screenshots behind the module cards, in one native modal dialog: a link
 * with data-module-shot opens it on that module, the arrows, the dots and the
 * keyboard move between modules, Escape closes. The links point at the image
 * files themselves, so without JavaScript they still show the picture. The
 * dialog traps focus and returns it to the link afterwards.
 *
 * The picture takes as much of the screen as it can: on wide, short screens
 * (most laptops) the caption and the arrows stand beside it rather than under
 * it. The magnifying glass, or a click or tap on the picture, zooms in: the
 * picture then follows the mouse across the frame, or the finger as it drags,
 * or the arrow keys; another click, the magnifying glass or Escape zooms out.
 */
export function ModuleLightbox({ modules }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Once opened, every screenshot is fetched, so moving between modules is instant.
  const [opened, setOpened] = useState(false);
  const [zoom, setZoom] = useState<Zoom>(OUT);
  // True for a moment after zooming in or out (or a key press moves the picture), so that change eases while following the pointer does not.
  const [easing, setEasing] = useState(false);
  const easingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [frameWidth, setFrameWidth] = useState(0);
  const press = useRef<{ id: number; x: number; y: number; zoomX: number; zoomY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-module-shot]');
      if (!link) return;
      const index = modules.findIndex((item) => item.module === link.getAttribute('data-module-shot'));
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
  }, [modules]);

  // The frame's width decides which size of the picture to fetch and how far zooming goes.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(Math.round(entry?.contentRect.width ?? 0)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(easingTimer.current), []);

  const count = modules.length;
  const current = modules[active];
  if (!current) return null;
  const factor = zoomFactor(MODULE_SHOTS[current.module].width / 2, frameWidth);

  /** Zooms in or out, or moves by a key press, easing into place. */
  function ease(next: Zoom | ((zoom: Zoom) => Zoom)): void {
    setEasing(true);
    clearTimeout(easingTimer.current);
    easingTimer.current = setTimeout(() => setEasing(false), tokens.motion.duration.base);
    setZoom(next);
  }

  function show(index: number): void {
    setActive((index + count) % count);
    setZoom(OUT);
  }

  /** The point under the pointer, as shares of the frame. */
  function pointAt(event: PointerEvent<HTMLDivElement>): { x: number; y: number } {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, zoomX: zoom.x, zoomY: zoom.y, moved: false };
    // A finger dragging a zoomed picture keeps it even when it strays outside the frame.
    if (zoom.on && event.pointerType !== 'mouse') event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    const held = press.current?.id === event.pointerId ? press.current : null;
    if (held && Math.hypot(event.clientX - held.x, event.clientY - held.y) > TAP_PX) held.moved = true;
    if (!zoom.on) return;
    if (event.pointerType === 'mouse') {
      setZoom({ on: true, ...pointAt(event) });
    } else if (held) {
      // The picture moves with the finger: dragging left shows more of the right.
      const box = event.currentTarget.getBoundingClientRect();
      const reach = factor - 1;
      setZoom({
        on: true,
        x: clamp(held.zoomX - (event.clientX - held.x) / (box.width * reach)),
        y: clamp(held.zoomY - (event.clientY - held.y) / (box.height * reach)),
      });
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
    const held = press.current?.id === event.pointerId ? press.current : null;
    press.current = null;
    if (!held || held.moved) return;
    // A click or a tap: zoom in on that point, or back out.
    ease(zoom.on ? OUT : { on: true, ...pointAt(event) });
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="module-shot-title"
      aria-describedby="module-shot-caption"
      onKeyDown={(event) => {
        if (zoom.on) {
          const moves: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          ease((z) => ({ on: true, x: clamp(z.x + move[0]), y: clamp(z.y + move[1]) }));
          return;
        }
        if (count < 2) return;
        if (event.key === 'ArrowRight') show(active + 1);
        if (event.key === 'ArrowLeft') show(active - 1);
      }}
      // Escape zooms out first, then closes.
      onCancel={(event) => {
        if (!zoom.on) return;
        event.preventDefault();
        ease(OUT);
      }}
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
            <span className="sr-only">{MODULE_LABELS[current.module]}</span>
          </h2>
          {count > 1 ? (
            <ol className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2" aria-label="Modules">
              {modules.map((item, index) => (
                <li key={item.module}>
                  <button
                    type="button"
                    onClick={() => show(index)}
                    aria-current={index === active ? 'true' : undefined}
                    className={cn('block size-2.5 rounded-full transition-colors', index === active ? 'bg-fg' : 'bg-fg-subtle/50 hover:bg-fg-muted')}
                  >
                    <span className="sr-only">{MODULE_LABELS[item.module]}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => ease(zoom.on ? OUT : { on: true, x: 0.5, y: 0.5 })} className={pillButton}>
              {zoom.on ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
              <span className="max-sm:sr-only">{zoom.on ? 'Zoom out' : 'Zoom in'}</span>
            </button>
            <button
              ref={closeButton}
              type="button"
              onClick={() => dialog.current?.close()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg"
            >
              <X className="size-5" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col shot-wide:grid shot-wide:grid-cols-[minmax(0,1fr)_20rem]">
          <figure className="m-0">
            <div
              ref={frame}
              className={cn(
                'module-shot relative aspect-[16/10] w-full overflow-hidden bg-canvas-raised select-none',
                zoom.on ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in touch-manipulation',
              )}
              data-easing={easing ? '' : undefined}
              aria-live="polite"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (press.current = null)}
            >
              {opened
                ? modules.map((item, index) => {
                    const shown = index === active;
                    const zoomed = shown && zoom.on;
                    return (
                      <Image
                        key={item.module}
                        src={MODULE_SHOTS[item.module]}
                        alt={`A screen from ${MODULE_LABELS[item.module]}.`}
                        // Fetched at the frame's size, and at the zoomed size once zoomed in, so a close look stays sharp.
                        sizes={zoomed ? `${Math.ceil(factor * frameWidth)}px` : frameWidth ? `${frameWidth}px` : '100vw'}
                        quality={85}
                        priority={shown}
                        draggable={false}
                        className={cn('absolute inset-0 h-full w-full origin-top-left object-cover', shown ? '' : 'invisible')}
                        style={
                          zoomed ? { transform: `translate(${-zoom.x * (factor - 1) * 100}%, ${-zoom.y * (factor - 1) * 100}%) scale(${factor})` } : undefined
                        }
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
              <span className="font-medium text-fg">{current.description}</span> {current.inside}
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
                    <span className="max-sm:sr-only">{MODULE_LABELS[modules[(active - 1 + count) % count]!.module]}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => show(active + 1)}
                  className={cn(pillButton, 'col-start-3 row-start-1 shot-wide:col-start-2 shot-wide:row-start-2 shot-wide:justify-self-end')}
                >
                  <span>
                    <span className="sr-only">Next module: </span>
                    <span className="max-sm:sr-only">{MODULE_LABELS[modules[(active + 1) % count]!.module]}</span>
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
