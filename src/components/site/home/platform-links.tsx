'use client';

import { m, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';
import { tokens, type ModuleKey } from '@/theme/tokens';

const { links, ease } = tokens.motion;
const seconds = (ms: number) => ms / 1000;

/** Each line down fades from the hairline color into its module's jewel color. */
const down: Record<ModuleKey, string> = {
  build: 'to-module-build',
  studios: 'to-module-studios',
  playbook: 'to-module-playbook',
  university: 'to-module-university',
  compass: 'to-module-compass',
};

const jewel: Record<ModuleKey, string> = {
  build: 'jewel-build',
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
};

/* A light runs along a line once, when the lines first come into view; `custom` is when it starts, in seconds. */
const lightDown: Variants = {
  off: { y: '-100%' },
  on: (delay: number) => ({ y: '100%', transition: { delay, duration: seconds(links.down), ease: ease.inOut } }),
};
const lightAcross: Variants = {
  off: { x: '-100%' },
  on: (delay: number) => ({ x: '100%', transition: { delay, duration: seconds(links.across), ease: 'linear' } }),
};

function Light({ variants, delay, className }: { variants: Variants; delay: number; className: string }) {
  return <m.span variants={variants} custom={delay} className={cn('absolute inset-0 from-transparent via-fg to-transparent', className)} />;
}

/** Half of the line joining the modules: from this module's line to the middle of the gap beside it. */
function Across({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  return (
    <span className={cn('absolute top-1/2 h-px -translate-y-1/2 overflow-hidden bg-fg-subtle/40', side === 'left' ? 'right-1/2 -left-2' : 'left-1/2 -right-2')}>
      <Light variants={lightAcross} delay={delay} className="bg-linear-to-r" />
    </span>
  );
}

/**
 * The lines that tie the core CRM to every module and the modules to each
 * other, in the gap between the CRM card and the module cards. On wide
 * screens a line runs down to each module, in the module columns, and one
 * line joins them all; narrower screens stack the cards, so one line joins
 * the CRM to the stack. Decorative: the cards say what they are.
 */
export function PlatformLinks({ modules }: { modules: readonly ModuleKey[] }) {
  const start = seconds(links.delay);
  // The light along the joining line sets off as the lights down arrive, and runs left to right, half a gap at a time.
  const acrossStart = start + seconds(links.stagger * (modules.length - 1) + links.down * 0.6);
  const acrossDelay = (half: number) => acrossStart + (half * seconds(links.across)) / 2;

  return (
    <>
      <m.div aria-hidden initial="off" whileInView="on" viewport={{ once: true, amount: 0.5 }} className="relative z-10 hidden h-16 grid-cols-5 gap-4 lg:grid">
        {modules.map((module, i) => (
          <div key={`${module}-${i}`} className="relative">
            {i > 0 ? <Across side="left" delay={acrossDelay(2 * i - 1)} /> : null}
            {i < modules.length - 1 ? <Across side="right" delay={acrossDelay(2 * i)} /> : null}
            <span className={cn('absolute inset-y-0 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-linear-to-b from-fg-subtle/40', down[module])}>
              <Light variants={lightDown} delay={start + seconds(links.stagger * i)} className="bg-linear-to-b" />
            </span>
            <span className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle/60" />
            <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-subtle" />
            <span className={cn('absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full', jewel[module])} />
          </div>
        ))}
      </m.div>
      <m.div
        aria-hidden
        initial="off"
        whileInView="on"
        viewport={{ once: true, amount: 0.5 }}
        className="relative mx-auto h-10 w-px overflow-hidden bg-fg-subtle/40 lg:hidden"
      >
        <Light variants={lightDown} delay={start} className="bg-linear-to-b" />
      </m.div>
    </>
  );
}
