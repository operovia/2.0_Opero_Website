'use client';

import { m } from 'motion/react';
import { tokens } from '@/theme/tokens';
import { Light, lightRun, lightRuns } from '../light';

const { links } = tokens.motion;
const seconds = (ms: number) => ms / 1000;
/** Across the short line in the time light takes to reach a module. */
const across = lightRun({ x: '-100%' }, { x: '100%' }, links.reach);

const dot = 'absolute size-1.5 rounded-full bg-fg-subtle/60';

/**
 * The line in the core panel joining the core data to the areas of work it
 * drives: across on wide screens, down on narrow ones, a dot at each end.
 * When it first comes into view, light runs along it from the data to the
 * work. Decorative.
 */
export function CoreJoin() {
  const start = seconds(links.delay);
  return (
    <m.div
      aria-hidden
      initial="off"
      whileInView="on"
      viewport={{ once: true, amount: 0.5 }}
      className="relative h-10 w-px shrink-0 bg-fg-subtle/40 xl:h-px xl:w-12"
    >
      <span className="absolute inset-0 overflow-hidden xl:hidden">
        <Light variants={lightRuns.down} delay={start} vertical />
      </span>
      <span className="absolute inset-0 hidden overflow-hidden xl:block">
        <Light variants={across} delay={start} />
      </span>
      <span className={`${dot} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 xl:hidden`} />
      <span className={`${dot} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 xl:hidden`} />
      <span className={`${dot} top-1/2 left-0 hidden -translate-x-1/2 -translate-y-1/2 xl:block`} />
      <span className={`${dot} top-1/2 right-0 hidden translate-x-1/2 -translate-y-1/2 xl:block`} />
    </m.div>
  );
}
