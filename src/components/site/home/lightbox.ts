import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject, type SyntheticEvent } from 'react';
import { tokens } from '@/theme/tokens';

/**
 * What the lightboxes share: the module screenshots (module-lightbox.tsx) and
 * the OperoGo screens (go-lightbox.tsx) look and zoom alike.
 */

/** On phones the buttons are round, with only the icon showing: the words would not fit. Screen readers hear the words everywhere. */
export const pillButton =
  'inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-line-input hover:bg-surface-raised disabled:pointer-events-none disabled:opacity-40 max-sm:w-10 max-sm:justify-center max-sm:gap-0 max-sm:px-0';

/** Round, with only the icon showing, at every size; screen readers hear the words. */
export const iconButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-fg transition-colors hover:border-line-input hover:bg-surface-raised';

export const closeButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg';

/**
 * Where a zoomed picture is looking: the point of the picture, as shares of
 * its width and height, that shows at the same share of the frame. Moving the
 * pointer across the frame therefore moves across the whole picture.
 */
export type Zoom = { on: boolean; x: number; y: number };
export const OUT: Zoom = { on: false, x: 0.5, y: 0.5 };
const clamp = (n: number) => Math.min(1, Math.max(0, n));
/** How far one arrow key moves a zoomed picture, as a share of the way across. */
const STEP = 0.1;
/** A press that moves less than this before it lets go is a click or a tap, not a drag. */
const TAP_PX = 6;
/** Zoomed, a picture shows at least twice its fitted size, and at least the size it was drawn at, which is its own width in CSS pixels; never more than four times. */
const zoomFactor = (drawnWidth: number, frameWidth: number) => (frameWidth ? Math.min(4, Math.max(2, drawnWidth / frameWidth)) : 2);
const MOVES: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] };

/**
 * Zooming a lightbox's picture. The frame (the element `frame` points at,
 * given `frameProps`) shows the picture; the magnifying glass, or a click or
 * tap on the frame, zooms in on that point. Zoomed, the picture follows the
 * mouse across the frame, or the finger as it drags, or the arrow keys;
 * another click, the magnifying glass or Escape zooms out. `drawnWidth` is
 * the width the picture was drawn at, in CSS pixels.
 */
export function useZoom(frame: RefObject<HTMLDivElement | null>, drawnWidth: number) {
  const [zoom, setZoom] = useState<Zoom>(OUT);
  // True for a moment after zooming in or out (or a key press moves the picture), so that change eases while following the pointer does not.
  const [easing, setEasing] = useState(false);
  const easingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [frameWidth, setFrameWidth] = useState(0);
  const press = useRef<{ id: number; x: number; y: number; zoomX: number; zoomY: number; moved: boolean } | null>(null);

  // The frame's width decides which size of the picture to fetch and how far zooming goes.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(Math.round(entry?.contentRect.width ?? 0)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [frame]);

  useEffect(() => () => clearTimeout(easingTimer.current), []);

  const factor = zoomFactor(drawnWidth, frameWidth);

  /** Zooms in or out, or moves by a key press, easing into place. */
  function ease(next: Zoom | ((zoom: Zoom) => Zoom)): void {
    setEasing(true);
    clearTimeout(easingTimer.current);
    easingTimer.current = setTimeout(() => setEasing(false), tokens.motion.duration.base);
    setZoom(next);
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

  return {
    zoom,
    setZoom,
    factor,
    /** The magnifying glass: zoom in on the middle, or back out. */
    toggle: () => ease(zoom.on ? OUT : { on: true, x: 0.5, y: 0.5 }),
    /** Zoomed, the arrow keys look around the picture and no other key moves on; true when the key was the zoom's. */
    onKey(event: KeyboardEvent): boolean {
      if (!zoom.on) return false;
      const move = MOVES[event.key];
      if (move) {
        event.preventDefault();
        ease((z) => ({ on: true, x: clamp(z.x + move[0]), y: clamp(z.y + move[1]) }));
      }
      return true;
    },
    /** For the dialog's cancel event: Escape zooms out first, then closes. */
    onCancel(event: SyntheticEvent<HTMLDialogElement>): void {
      if (!zoom.on) return;
      event.preventDefault();
      ease(OUT);
    },
    frameProps: {
      'data-easing': easing ? '' : undefined,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: () => (press.current = null),
    },
    /** The frame's cursor and how touch behaves on it: zoomed, a finger drags the picture instead of the page. */
    frameClass: zoom.on ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in touch-manipulation',
    /** What size of the picture to fetch: the frame's, and the zoomed size once zoomed in, so a close look stays sharp. */
    sizes: (zoomed: boolean) => (zoomed ? `${Math.ceil(factor * frameWidth)}px` : frameWidth ? `${frameWidth}px` : '100vw'),
    /** The picture's transform while zoomed, from its top left corner. */
    style: (zoomed: boolean): CSSProperties | undefined =>
      zoomed ? { transform: `translate(${-zoom.x * (factor - 1) * 100}%, ${-zoom.y * (factor - 1) * 100}%) scale(${factor})` } : undefined,
  };
}
