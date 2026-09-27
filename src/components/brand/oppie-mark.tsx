import { useId, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { tokens, type ModuleKey } from '@/theme/tokens';

export type OppieState = 'idle' | 'thinking';

/**
 * The mark's geometry, from the supplied component (docs/brand/oppie-2c.zip),
 * in its viewBox units: each slice's outline, the small gap it sits out from
 * the center at rest, and how far it pushes out while thinking.
 */
const slices: { module: ModuleKey; d: string; rest: [number, number]; push: [number, number] }[] = [
  { module: 'build', d: 'M100 100L100.00 20.00A80 80 0 0 1 176.08 75.28Z', rest: [1.76, -2.43], push: [5.29, -7.28] },
  { module: 'studios', d: 'M100 100L176.08 75.28A80 80 0 0 1 147.02 164.72Z', rest: [2.85, 0.93], push: [8.56, 2.78] },
  { module: 'playbook', d: 'M100 100L147.02 164.72A80 80 0 0 1 52.98 164.72Z', rest: [0, 3], push: [0, 9] },
  { module: 'university', d: 'M100 100L52.98 164.72A80 80 0 0 1 23.92 75.28Z', rest: [-2.85, 0.93], push: [-8.56, 2.78] },
  { module: 'compass', d: 'M100 100L23.92 75.28A80 80 0 0 1 100.00 20.00Z', rest: [-1.76, -2.43], push: [-5.29, -7.28] },
];

/** Room around the pie for the halo, the push, and the shadow. Don't crop tighter. */
const VIEW_BOX = '-10 -10 220 220';

/** A #RRGGBB color with each channel multiplied, as a brightness filter does. */
function brighten(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1, 7), 16);
  const channel = (shift: number) => Math.min(255, Math.round(((value >> shift) & 255) * amount));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

type Props = {
  /** At rest the mark breathes; while thinking, its slices push out and light up in turn. */
  state?: OppieState;
  /** The background the mark sits on. */
  on?: 'dark' | 'light';
  /** Hold still, for example while a demo is paused. Motion also stops for visitors who ask for reduced motion. */
  still?: boolean;
  /**
   * Close the small gaps the slices sit apart at rest, so the rim reads as
   * one smooth circle. At small sizes the gaps look like cracks.
   */
  joined?: boolean;
  /** Size with a size class, e.g. `size-10`. The pie fills the middle 73%; the rest is room for motion and shadow. */
  className?: string;
  /** Hide from assistive tech when a surrounding label already names it. */
  decorative?: boolean;
};

/**
 * Oppie's mark, drawn from the supplied component with its two states.
 * Switch `state` on the same element rather than swapping marks, so it never
 * flickers or shifts. Motion is transform and opacity only: the halo and the
 * breathing pie are separate layers, and where the supplied component
 * brightens a slice with a filter, this fades in a copy of the slice with
 * every color and its shine made that much brighter, which looks the same.
 */
export function OppieMark({ state = 'idle', on = 'dark', still = false, joined = false, className, decorative }: Props) {
  // Gradient and filter ids must be unique on the page, and plain enough for url(#...).
  const id = `oppie${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { oppie } = tokens.brand;
  const halo = oppie.halo[on];
  const shadow = oppie.shadow[on];
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Oppie' };
  // Joined slices also get a hairline of their own color, so no seam shows where two meet.
  const seam = (fill: string) => (joined ? { stroke: fill, strokeWidth: 0.6, strokeLinejoin: 'round' as const } : {});

  return (
    <span className={cn('oppie relative inline-block shrink-0', className)} data-state={state} data-still={still ? '' : undefined} {...a11y}>
      <svg viewBox={VIEW_BOX} className="oppie-halo absolute inset-0 size-full" aria-hidden focusable="false">
        <defs>
          <radialGradient id={`${id}-halo`}>
            <stop offset=".55" stopColor={halo.color} stopOpacity={halo.opacity} />
            <stop offset="1" stopColor={halo.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill={`url(#${id}-halo)`} />
      </svg>
      <svg viewBox={VIEW_BOX} className="oppie-pie relative block size-full" aria-hidden focusable="false">
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
          {slices.map(({ module, d, rest, push }, turn) => (
            <g key={module} transform={joined ? undefined : `translate(${rest[0]} ${rest[1]})`}>
              <g
                className="oppie-slice"
                style={{ '--oppie-x': `${push[0]}px`, '--oppie-y': `${push[1]}px`, '--oppie-turn': turn / slices.length } as CSSProperties}
              >
                <path d={d} fill={`url(#${id}-${module})`} {...seam(`url(#${id}-${module})`)} />
                <path d={d} fill={`url(#${id}-shine)`} />
                <g className="oppie-lit">
                  <path d={d} fill={`url(#${id}-${module}-lit)`} {...seam(`url(#${id}-${module}-lit)`)} />
                  <path d={d} fill={`url(#${id}-shine-lit)`} />
                </g>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </span>
  );
}
