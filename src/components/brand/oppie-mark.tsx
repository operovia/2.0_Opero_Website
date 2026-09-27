'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { tokens, type ModuleKey } from '@/theme/tokens';

/** How engaged Oppie is (docs/brand/oppie-motion-spec.md). Only the relay's speed changes between them. */
export type OppieState = 'calm' | 'listening' | 'working' | 'thinking';

/**
 * The slices' outlines, from the supplied component (docs/brand/oppie-2c.zip),
 * in its viewBox units: five 72° slices from 12 o'clock, clockwise, in brand
 * order. Each sits a little out from the center along its bisector, and the
 * relay pushes it further out the same way.
 */
const slices: { module: ModuleKey; d: string }[] = [
  { module: 'build', d: 'M100 100L100.00 20.00A80 80 0 0 1 176.08 75.28Z' },
  { module: 'studios', d: 'M100 100L176.08 75.28A80 80 0 0 1 147.02 164.72Z' },
  { module: 'playbook', d: 'M100 100L147.02 164.72A80 80 0 0 1 52.98 164.72Z' },
  { module: 'university', d: 'M100 100L52.98 164.72A80 80 0 0 1 23.92 75.28Z' },
  { module: 'compass', d: 'M100 100L23.92 75.28A80 80 0 0 1 100.00 20.00Z' },
];

/** A distance along slice `i`'s bisector as [x, y], rounded as in the supplied geometry. */
function along(i: number, distance: number): [number, number] {
  const angle = ((72 * i - 54) * Math.PI) / 180;
  return [+(Math.cos(angle) * distance).toFixed(2), +(Math.sin(angle) * distance).toFixed(2)];
}

/** Room around the pie for the push and the shadow. Don't crop tighter. */
const VIEW_BOX = '-10 -10 220 220';

/** A #RRGGBB color with each channel multiplied, as a brightness filter does. */
function brighten(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1, 7), 16);
  const channel = (shift: number) => Math.min(255, Math.round(((value >> shift) & 255) * amount));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

const labels: Record<OppieState, string> = { calm: 'Oppie', listening: 'Oppie', working: 'Oppie is working', thinking: 'Oppie is thinking' };

/**
 * Eases the relay to the state's speed by changing the running animations'
 * playback rate, so it speeds up or slows down from wherever it is and never
 * restarts. The CSS runs it at the calm speed, which is also how it moves
 * before this script loads.
 */
function useRelaySpeed(ref: RefObject<HTMLElement | null>, state: OppieState, still: boolean) {
  const rate = useRef(1);
  useEffect(() => {
    const element = ref.current;
    if (!element || still) return;
    const { lap, speedUp, slowDown } = tokens.motion.oppie;
    const from = rate.current;
    const target = lap.calm / lap[state];
    const apply = (value: number) => {
      rate.current = value;
      for (const animation of element.getAnimations({ subtree: true })) animation.playbackRate = value;
    };
    if (from === target || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(target);
      return;
    }
    const duration = target > from ? speedUp : slowDown;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / duration);
      apply(from + (target - from) * t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [ref, state, still]);
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
  /** How engaged Oppie is. Only the relay's speed changes: calm at rest, quickest while thinking. */
  state?: OppieState;
  /** The background the mark sits on. */
  on?: 'dark' | 'light';
  /** For a mark 24 to 39px across: a shorter push, so the relay stays within bounds. */
  compact?: boolean;
  /** The static mark, for marks under 24px and anywhere nothing may move. Reduced motion always gets it. */
  still?: boolean;
  /** Freeze the relay where it is, for example while a demo is paused. It carries on from there. */
  paused?: boolean;
  /** Size with a size class, e.g. `size-10`. The pie fills the middle 73%; the rest is room for motion and shadow. */
  className?: string;
  /** Hide from assistive tech when a surrounding label already names it. */
  decorative?: boolean;
};

/**
 * Oppie's mark, drawn and moved as docs/brand/oppie-motion-spec.md describes:
 * the relay passes from slice to slice, and `state` only changes its speed.
 * Change `state` on the same element rather than swapping marks. Motion is
 * transform and opacity only: where a slice brightens, a copy of it with
 * every color and its shine made that much brighter fades in, which looks the
 * same as the brightness filter in the supplied component.
 */
export function OppieMark({ state = 'calm', on = 'dark', compact = false, still = false, paused = false, className, decorative }: Props) {
  // Gradient and filter ids must be unique on the page, and plain enough for url(#...).
  const id = `oppie${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ref = useRef<HTMLSpanElement>(null);
  useRelaySpeed(ref, state, still);
  const asleep = useAsleep(ref, still);
  const { oppie } = tokens.brand;
  const shadow = oppie.shadow[on];
  const push = compact ? oppie.push.compact : oppie.push.full;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': labels[state] };

  return (
    <span
      ref={ref}
      className={cn('oppie inline-block shrink-0', className)}
      data-still={still ? '' : undefined}
      data-paused={paused || asleep ? '' : undefined}
      {...a11y}
    >
      <svg viewBox={VIEW_BOX} className="block size-full" aria-hidden focusable="false">
        <defs>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy={shadow.offset} stdDeviation={shadow.blur} floodColor={shadow.color} floodOpacity={shadow.opacity} />
          </filter>
          {[1, oppie.litBrightness].map((amount) => {
            const suffix = amount === 1 ? '' : '-lit';
            return [
              <radialGradient key={`shine${suffix}`} id={`${id}-shine${suffix}`} cx=".34" cy=".3" r=".6">
                {oppie.shine.stops.map(({ offset, opacity }) => (
                  <stop key={offset} offset={offset} stopColor={oppie.shine.color} stopOpacity={Math.min(1, opacity * amount)} />
                ))}
              </radialGradient>,
              ...slices.map(({ module }) => (
                <radialGradient key={`${module}${suffix}`} id={`${id}-${module}${suffix}`} gradientUnits="userSpaceOnUse" cx="72" cy="68" r="92">
                  {oppie.slices[module].map((color, i) => (
                    <stop key={i} offset={i / 2} stopColor={brighten(color, amount)} />
                  ))}
                </radialGradient>
              )),
            ];
          })}
        </defs>
        <g filter={`url(#${id}-shadow)`}>
          {slices.map(({ module, d }, turn) => {
            const [x, y] = along(turn, oppie.gap);
            const [pushX, pushY] = along(turn, push);
            return (
              <g key={module} transform={`translate(${x} ${y})`}>
                <g className="oppie-slice" style={{ '--oppie-x': `${pushX}px`, '--oppie-y': `${pushY}px`, '--oppie-turn': turn / slices.length } as CSSProperties}>
                  <path d={d} fill={`url(#${id}-${module})`} />
                  <path d={d} fill={`url(#${id}-shine)`} />
                  <g className="oppie-lit">
                    <path d={d} fill={`url(#${id}-${module}-lit)`} />
                    <path d={d} fill={`url(#${id}-shine-lit)`} />
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </span>
  );
}
