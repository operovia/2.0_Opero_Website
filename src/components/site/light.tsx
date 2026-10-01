'use client';

import { m, type HTMLMotionProps, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

const { links } = tokens.motion;
const seconds = (ms: number) => ms / 1000;

/* Each light runs along its line once; `custom` is when it starts, in seconds. */
export const lightRun = (from: { x?: string; y?: string }, to: { x?: string; y?: string }, duration: number): Variants => ({
  off: from,
  on: (delay: number) => ({ ...to, transition: { delay, duration: seconds(duration), ease: 'linear' } }),
});

/**
 * The runs a light can make, from the platform network's timing: `reach` up
 * or down a module's line, `across` the line joining the modules.
 */
export const lightRuns = {
  up: lightRun({ y: '100%' }, { y: '-100%' }, links.reach),
  down: lightRun({ y: '-100%' }, { y: '100%' }, links.reach),
  leftward: lightRun({ x: '100%' }, { x: '-100%' }, links.across),
  rightward: lightRun({ x: '-100%' }, { x: '100%' }, links.across),
} as const;

type Props = Omit<HTMLMotionProps<'span'>, 'variants' | 'custom'> & {
  /** One of `lightRuns`, driven by the parent's variants (the platform network's way). Leave out to drive the span imperatively. */
  variants?: Variants;
  /** When a variant-driven run starts, in seconds after the parent turns on. */
  delay?: number;
  vertical?: boolean;
};

/**
 * A running light: a soft bright middle fading to nothing at both ends, the
 * size of the line it lives in. The parent clips it (overflow hidden), so
 * it appears from one end and leaves at the other. The platform network
 * (src/components/site/home/platform-network.tsx) drives it with variants;
 * the front door (src/components/door/door.tsx) drives it with useAnimate.
 */
export function Light({ variants, delay, vertical, className, ...props }: Props) {
  return (
    <m.span
      variants={variants}
      custom={delay}
      className={cn('absolute inset-0 from-transparent via-fg to-transparent', vertical ? 'bg-linear-to-b' : 'bg-linear-to-r', className)}
      {...props}
    />
  );
}
