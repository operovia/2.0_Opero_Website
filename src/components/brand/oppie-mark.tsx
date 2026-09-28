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
export function OppieMark({ state = 'rest', on = 'dark', still = false, paused = false, className, decorative }: Props) {
  // Gradient ids must be unique on the page, and plain enough for url(#...).
  const id = `oppie${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ref = useRef<HTMLSpanElement>(null);
  const spinning = useFlip(ref, state === 'thinking', still);
  const asleep = useAsleep(ref, still);
  const { pills, width, surface, surfaceStops, graphite, depth, shade, glint, rim } = tokens.brand.oppie;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': labels[state] };

  return (
    <span
      ref={ref}
      className={cn('oppie inline-block shrink-0', className)}
      data-spinning={spinning ? '' : undefined}
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
                  x={x + glint.left}
                  y={pill.y + glint.inset}
                  width={glint.width}
                  height={height - glint.inset * 2}
                  rx={glint.width / 2}
                  fill={glint.color}
                  fillOpacity={glint.opacity}
                />
              </g>
              <rect
                x={x + 0.5}
                y={pill.y + 0.5}
                width={width - 1}
                height={height - 1}
                rx={(width - 1) / 2}
                fill="none"
                stroke={rim[on].color}
                strokeOpacity={rim[on].opacity}
              />
            </g>
          );
        })}
      </svg>
    </span>
  );
}
