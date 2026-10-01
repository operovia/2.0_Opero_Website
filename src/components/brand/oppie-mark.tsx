'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

/** At rest Oppie stands still; while thinking, the pills turn over (docs/brand/oppie-8e-handoff.md). */
export type OppieState = 'rest' | 'thinking';

const labels: Record<OppieState, string> = { rest: 'Oppie', thinking: 'Oppie is thinking' };

/**
 * Runs the flip while Oppie thinks. When thinking ends, each pill finishes the
 * turn it is in and stops facing forward, so the ripple settles rather than
 * cutting off mid-spin. Returns whether the flip is on.
 */
function useFlip(ref: RefObject<HTMLElement | null>, thinking: boolean, still: boolean): boolean {
  // When thinking ends the flip stays on, settling, until every pill has finished its turn.
  const [wasThinking, setWasThinking] = useState(thinking);
  const [settling, setSettling] = useState(false);
  if (thinking !== wasThinking) {
    setWasThinking(thinking);
    setSettling(!thinking);
  }
  const finishing = useRef<Animation[]>([]);

  useEffect(() => {
    const element = ref.current;
    if (!element || still) return;
    if (thinking) {
      // Thinking again before the last turns settled: keep them going.
      for (const animation of finishing.current) {
        animation.effect?.updateTiming({ iterations: Infinity });
        if (animation.playState === 'finished' || animation.playState === 'idle') animation.play();
      }
      finishing.current = [];
      return;
    }
    if (!settling) return;
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) {
      const turn = animation.effect?.getComputedTiming().currentIteration;
      // A pill still waiting for its first turn stays put; the others finish the turn they are in.
      if (turn == null) animation.cancel();
      else animation.effect?.updateTiming({ iterations: turn + 1 });
    }
    finishing.current = animations;
    let current = true;
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (!current) return;
      finishing.current = [];
      setSettling(false);
    });
    return () => {
      current = false;
    };
  }, [ref, thinking, settling, still]);

  return !still && (thinking || settling);
}

/** True from the moment the mark is first well into view, for a mark that greets once. */
function useGreeting(ref: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [greeting, setGreeting] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setGreeting(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return greeting;
}

/** True while the tab is hidden or the mark is off screen: nobody sees it then, so it holds still and saves the battery. */
function useAsleep(ref: RefObject<HTMLElement | null>, still: boolean): boolean {
  const [asleep, setAsleep] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || still) return;
    let hidden = document.visibilityState === 'hidden';
    let offscreen = false;
    const update = () => setAsleep(hidden || offscreen);
    const onVisibility = () => {
      hidden = document.visibilityState === 'hidden';
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      offscreen = !entry?.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, still]);
  return asleep;
}

type Props = {
  /** Resting, or thinking: forming or streaming an answer. Change it on the same element; the flip starts and settles smoothly. */
  state?: OppieState;
  /** The background the mark sits on. Dark backgrounds get brighter tones. */
  on?: 'dark' | 'light';
  /** Never moves, for marks under 24px and anywhere nothing may move. Reduced motion always holds it still. */
  still?: boolean;
  /** Freeze the flip where it is, for example while a demo is paused. It carries on from there. */
  paused?: boolean;
  /** Turn over once when it first comes into view, then rest. For a mark that stands for Oppie on the page, not one in a conversation. */
  greet?: boolean;
  /** Finer details for a mark shown big, 120px and up, where the icon-size highlight and outline read heavy. */
  large?: boolean;
  /**
   * Keeps a light on: the whole mark dims and brightens slowly at uneven
   * moments, like a pilot light, while it is on screen. At the owner's
   * request, for the mark in the middle of the platform network. It cycles
   * for as long as it shows, so give it a way to be paused.
   */
  flicker?: boolean;
  /** Size with a size class, e.g. `size-10`. The pills fill the middle 80%. */
  className?: string;
  /** Hide from assistive tech when a surrounding label already names it. */
  decorative?: boolean;
};

/**
 * Oppie's mark, drawn and moved as docs/brand/oppie-8e-handoff.md describes:
 * five pills, one per module in brand order, each a jewel tone fading into a
 * shared graphite base. Each pill is its curved surface, the light and
 * graphite over it, a shade for its side, its highlight, and a fine rim.
 * Motion is transform and opacity only.
 */
export function OppieMark({
  state = 'rest',
  on = 'dark',
  still = false,
  paused = false,
  greet = false,
  large = false,
  flicker = false,
  className,
  decorative,
}: Props) {
  // Gradient ids must be unique on the page, and plain enough for url(#...).
  const id = `oppie${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ref = useRef<HTMLSpanElement>(null);
  const spinning = useFlip(ref, state === 'thinking', still);
  const greeting = useGreeting(ref, greet && !still);
  const asleep = useAsleep(ref, still);
  const { pills, width, surface, surfaceStops, graphite, depth, shade, glint, rim } = tokens.brand.oppie;
  const fine = large ? tokens.brand.oppie.large : null;
  const highlight = fine ? fine.glint : glint;
  const edge = fine ? fine.rim.width : 1;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': labels[state] };

  return (
    <span
      ref={ref}
      className={cn('oppie inline-block shrink-0', className)}
      data-spinning={spinning ? '' : undefined}
      data-greeting={greeting ? '' : undefined}
      data-flicker={flicker && !still ? '' : undefined}
      data-paused={paused || asleep ? '' : undefined}
      {...a11y}
    >
      <svg viewBox="0 0 100 100" className="block size-full" aria-hidden focusable="false">
        <defs>
          {pills.map(({ module }) => (
            <linearGradient key={module} id={`${id}-${module}`} x1="0" y1="0" x2="1" y2="0">
              {surface[on][module].map((color, i) => (
                <stop key={i} offset={surfaceStops[i]} stopColor={color} />
              ))}
            </linearGradient>
          ))}
          <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={depth.lightTop.color} stopOpacity={depth.lightTop.opacity} />
            <stop offset={depth.lightTop.until} stopColor={depth.lightTop.color} stopOpacity="0" />
            <stop offset={depth.graphiteFrom} stopColor={graphite[on]} stopOpacity="0" />
            <stop offset="1" stopColor={graphite[on]} stopOpacity={depth.graphiteOpacity} />
          </linearGradient>
          {fine ? (
            <>
              <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="0" y2="1">
                {fine.glint.stops.map(({ offset, opacity }) => (
                  <stop key={offset} offset={offset} stopColor={glint.color} stopOpacity={opacity} />
                ))}
              </linearGradient>
              <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
                {fine.rim.stops.map(({ offset, opacity }) => (
                  <stop key={offset} offset={offset} stopColor={rim[on].color} stopOpacity={opacity} />
                ))}
              </linearGradient>
            </>
          ) : null}
        </defs>
        {pills.map(({ module, x, height }, i) => {
          const pill = { x, y: 50 - height / 2, width, height, rx: width / 2 };
          return (
            <g key={module} className="oppie-pill" style={{ '--oppie-index': i } as CSSProperties}>
              <rect {...pill} fill={`url(#${id}-${module})`} />
              <rect {...pill} fill={`url(#${id}-depth)`} />
              <rect {...pill} className="oppie-shade" fill={shade} />
              <g className="oppie-glint">
                <rect
                  x={x + highlight.left}
                  y={pill.y + highlight.inset}
                  width={highlight.width}
                  height={height - highlight.inset * 2}
                  rx={highlight.width / 2}
                  fill={fine ? `url(#${id}-glint)` : glint.color}
                  fillOpacity={fine ? undefined : glint.opacity}
                />
              </g>
              <rect
                x={x + edge / 2}
                y={pill.y + edge / 2}
                width={width - edge}
                height={height - edge}
                rx={(width - edge) / 2}
                fill="none"
                stroke={fine ? `url(#${id}-rim)` : rim[on].color}
                strokeOpacity={fine ? undefined : rim[on].opacity}
                strokeWidth={edge}
              />
            </g>
          );
        })}
      </svg>
    </span>
  );
}
