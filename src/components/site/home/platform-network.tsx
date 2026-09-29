'use client';

import { m } from 'motion/react';
import type { CSSProperties } from 'react';
import { OppieMark } from '@/components/brand/oppie-mark';
import { cn } from '@/lib/cn';
import { tokens, type ModuleKey } from '@/theme/tokens';
import { Light, lightRuns } from '../light';

const { links } = tokens.motion;
const seconds = (ms: number) => ms / 1000;
const { up, down, leftward, rightward } = lightRuns;

const jewel: Record<ModuleKey, string> = {
  build: 'jewel-build',
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
};

/** Below the line joining the modules, each line takes on its module's color. */
const toModule: Record<ModuleKey, string> = {
  build: 'to-module-build',
  studios: 'to-module-studios',
  playbook: 'to-module-playbook',
  university: 'to-module-university',
  compass: 'to-module-compass',
};

type Props = { modules: readonly ModuleKey[]; title: string; detail: string };

/**
 * How the platform fits together, between the CRM card and the module cards.
 * Oppie sits in the middle of the line that joins every module, in the
 * modules' colors, and lines run up from that line to the CRM and down to
 * each module: one per module column on wide screens, one each way on narrow
 * ones. When it first comes into view Oppie turns over once and light runs
 * out from it along every line. The lines are decorative; Oppie's note is not.
 */
export function PlatformNetwork({ modules, title, detail }: Props) {
  const count = modules.length;
  const start = seconds(links.delay);
  const middle = (count - 1) / 2;
  // Light leaving Oppie passes each module's column in turn, nearest first.
  const reaches = (i: number) => start + (seconds(links.across) * ((middle ? Math.abs(i - middle) / middle : 0) + 0.5)) / 2;
  const thread = `linear-gradient(to right, ${modules.map((module, i) => `var(--o-module-${module}-base) ${(i / Math.max(count - 1, 1)) * 100}%`).join(', ')})`;

  return (
    <m.div
      initial="off"
      whileInView="on"
      viewport={{ once: true, amount: 0.5 }}
      className="platform-band relative flex flex-col items-center lg:block lg:h-28"
      style={{ '--links': count } as CSSProperties}
    >
      {count > 1 ? (
        <div aria-hidden className="platform-thread absolute top-1/2 hidden h-px -translate-y-1/2 lg:block" style={{ backgroundImage: thread }}>
          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
            <Light variants={leftward} delay={start} />
          </span>
          <span className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <Light variants={rightward} delay={start} />
          </span>
        </div>
      ) : null}
      <div aria-hidden className="absolute inset-0 hidden grid-cols-5 gap-4 lg:grid">
        {modules.map((module, i) => (
          <div key={`${module}-${i}`} className="relative">
            <span className="absolute top-0 bottom-1/2 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-fg-subtle/40">
              <Light variants={up} delay={reaches(i)} vertical />
            </span>
            <span className={cn('absolute top-1/2 bottom-0 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-linear-to-b from-fg-subtle/40', toModule[module])}>
              <Light variants={down} delay={reaches(i)} vertical />
            </span>
            <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle/60" />
            <span className={cn('absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full', jewel[module])} />
            <span className={cn('absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full', jewel[module])} />
          </div>
        ))}
      </div>
      <span aria-hidden className="relative h-8 w-px overflow-hidden bg-fg-subtle/40 lg:hidden">
        <Light variants={up} delay={start} vertical />
      </span>
      <div className="platform-oppie relative z-10 flex items-center gap-3 rounded-2xl border border-line-strong bg-surface-raised py-2.5 pr-5 pl-3 shadow-lg lg:absolute lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        <OppieMark decorative greet className="size-9" />
        <p>
          <span className="block text-sm font-semibold text-fg">{title}</span>
          {detail ? <span className="block text-xs text-fg-muted">{detail}</span> : null}
        </p>
      </div>
      <span aria-hidden className="relative h-8 w-px overflow-hidden bg-fg-subtle/40 lg:hidden">
        <Light variants={down} delay={start} vertical />
      </span>
    </m.div>
  );
}
