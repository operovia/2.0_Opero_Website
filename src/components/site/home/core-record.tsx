'use client';

import { Building2, ClipboardCheck, DoorOpen, KeyRound, UserRound, UserRoundSearch, Wrench, type LucideIcon } from 'lucide-react';
import { m, type Variants } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';
import { Light, lightRun, lightRuns } from '../light';

const { duration, ease, links } = tokens.motion;
const seconds = (ms: number) => ms / 1000;
const { up, down } = lightRuns;
/** The short runs between the frame and the three lines of work, each the time light takes to reach a module. */
const along = lightRun({ x: '-100%' }, { x: '100%' }, links.reach);

export type CoreRecordLabels = {
  property: string;
  suites: string;
  tenants: string;
  prospects: string;
  leasing: string;
  management: string;
  facilities: string;
};

const tile: Variants = {
  off: { opacity: 0, y: 8 },
  on: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.06,
      duration: seconds(duration.reveal),
      ease: ease.out,
    },
  }),
};

/** A line of work brightens the moment the light reaches it. */
const reached: Variants = {
  off: { opacity: 0.45 },
  on: (delay: number) => ({
    opacity: 1,
    transition: { delay, duration: seconds(duration.base), ease: ease.out },
  }),
};

const hairline = 'bg-fg-subtle/40';
const WIDE = '(min-width: 64rem)';
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
/** Whether the three lines stand beside the frame (wide screens) or hang below it. The server assumes wide; the timing is all that depends on it. */
const useWide = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );

type Props = { labels: CoreRecordLabels; className?: string };

/**
 * The drawing on the CRM card: the four kinds of record (a property, its
 * suites, the tenants in them and the prospects for them) gathered in one
 * frame edged in the wordmark's metal, and the three lines of work the CRM
 * drives, joined to it. When it first comes into view the four settle into
 * the frame, then light leaves it along the line and reaches each of the
 * three, which brighten as it arrives. On wide screens the three stand to
 * the right of the frame on a forked line; on narrow ones they hang below
 * it on one line. Decorative: the card's own copy says the same thing.
 */
export function CoreRecord({ labels, className }: Props) {
  const wide = useWide();
  const start = seconds(links.delay);
  const step = seconds(links.reach);
  const records: { icon: LucideIcon; label: string }[] = [
    { icon: Building2, label: labels.property },
    { icon: DoorOpen, label: labels.suites },
    { icon: UserRound, label: labels.tenants },
    { icon: UserRoundSearch, label: labels.prospects },
  ];
  // Beside the frame, the light takes a step to the fork, one more to the middle line, and another up or down to the outer two. Below it, one step per line.
  const drives: { icon: LucideIcon; label: string; at: number }[] = [
    {
      icon: KeyRound,
      label: labels.leasing,
      at: start + (wide ? 3 : 1) * step,
    },
    { icon: ClipboardCheck, label: labels.management, at: start + 2 * step },
    { icon: Wrench, label: labels.facilities, at: start + 3 * step },
  ];

  return (
    <m.div
      aria-hidden
      initial="off"
      whileInView="on"
      viewport={{ once: true, amount: 0.5 }}
      className={cn('flex flex-col items-center lg:flex-row lg:justify-center', className)}
    >
      <div className="core-place relative rounded-xl bg-canvas-raised px-6 py-5 shadow-md">
        <ul className="grid grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-4">
          {records.map(({ icon: Icon, label }, i) => (
            <m.li key={i} data-reveal custom={i} variants={tile} className="flex flex-col items-center gap-2">
              <span className="grid size-11 place-items-center rounded-md border border-line-strong bg-surface text-fg shadow-sm">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium text-fg-muted">{label}</span>
            </m.li>
          ))}
        </ul>
      </div>

      {/* Wide screens: one line leaves the frame, forks, and reaches each of the three. */}
      <div className="relative hidden w-16 self-stretch lg:grid lg:grid-rows-3 lg:gap-2">
        <span className={cn('absolute top-1/2 left-0 h-px w-1/2 -translate-y-1/2 overflow-hidden', hairline)}>
          <Light variants={along} delay={start} />
        </span>
        <span className={cn('absolute top-1/6 bottom-1/2 left-1/2 w-px -translate-x-1/2 overflow-hidden', hairline)}>
          <Light variants={up} delay={start + step} vertical />
        </span>
        <span className={cn('absolute top-1/2 bottom-1/6 left-1/2 w-px -translate-x-1/2 overflow-hidden', hairline)}>
          <Light variants={down} delay={start + step} vertical />
        </span>
        {drives.map(({ at }, i) => (
          <span key={i} className="relative">
            <span className={cn('absolute top-1/2 right-0 left-1/2 h-px -translate-y-1/2 overflow-hidden', hairline)}>
              <Light variants={along} delay={at - step} />
            </span>
            <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle/60" />
          </span>
        ))}
      </div>

      <ul className="flex flex-col items-center lg:grid lg:grid-rows-3 lg:gap-2">
        {drives.map(({ icon: Icon, label, at }, i) => (
          <li key={i} className="flex flex-col items-center lg:block">
            {/* Narrow screens: the three hang below the frame on one line, which the light runs down. */}
            <span className={cn('relative block h-6 w-px overflow-hidden lg:hidden', hairline)}>
              <Light variants={down} delay={start + i * step} vertical />
            </span>
            <m.span
              data-reveal
              custom={at}
              variants={reached}
              className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-raised py-1.5 pr-4 pl-3 text-sm font-medium text-fg shadow-sm"
            >
              <Icon className="size-4 text-fg-muted" strokeWidth={1.75} />
              {label}
            </m.span>
          </li>
        ))}
      </ul>
    </m.div>
  );
}
