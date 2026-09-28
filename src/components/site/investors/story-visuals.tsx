'use client';

import { m, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';
import { tokens, type ModuleKey } from '@/theme/tokens';

const { duration, ease } = tokens.motion;
const settle = { duration: duration.reveal / 1000, ease: ease.out };

/** The line the three steps hang from, drawn left to right as it scrolls into view. Wide screens only. */
export function StoryLine({ className }: { className?: string }) {
  return (
    <m.span
      aria-hidden
      data-reveal
      className={cn('investor-line block h-px origin-left', className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: (duration.reveal * 2) / 1000, ease: ease.inOut }}
    />
  );
}

/**
 * The problem: apps of every size, scattered and unconnected. Circles in the
 * picture's own units (it is 160 by 96), drawn as outlines.
 */
const apps = [
  { x: 12, y: 70, r: 7 },
  { x: 40, y: 28, r: 10 },
  { x: 66, y: 64, r: 5 },
  { x: 92, y: 22, r: 6 },
  { x: 106, y: 70, r: 11 },
  { x: 140, y: 34, r: 8 },
  { x: 150, y: 80, r: 4 },
];

const drift: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { ...settle, delay: 0.1 + i * 0.07 } }),
};

export function ScatteredApps({ className }: { className?: string }) {
  return (
    <m.svg
      aria-hidden
      viewBox="0 0 160 96"
      className={cn('h-full w-auto max-w-full overflow-visible', className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      {apps.map(({ x, y, r }, i) => (
        <m.circle key={i} data-reveal custom={i} variants={drift} cx={x} cy={y} r={r} className="fill-none stroke-fg-subtle" strokeWidth={1.5} />
      ))}
    </m.svg>
  );
}

/** The solution: the five modules, in brand order, joined on one line. Class names are written out so Tailwind finds them. */
const jewels: Record<ModuleKey, string> = {
  build: 'jewel-build',
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.8 },
  shown: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { ...settle, delay: 0.15 + i * 0.08 } }),
};

export function JoinedModules({ className }: { className?: string }) {
  return (
    <m.div
      aria-hidden
      className={cn('relative flex items-center gap-3', className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
    >
      <span className="absolute inset-x-5 top-1/2 h-px bg-line-strong" />
      {Object.entries(jewels).map(([module, jewel], i) => (
        <m.span key={module} data-reveal custom={i} variants={rise} className={cn('relative size-10 rounded-full shadow-sm', jewel)} />
      ))}
    </m.div>
  );
}
