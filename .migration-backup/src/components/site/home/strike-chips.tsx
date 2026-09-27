'use client';

import { m, type Variants } from 'motion/react';
import { tokens } from '@/theme/tokens';

const ease = tokens.motion.ease.out;

const chip: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const label: Variants = {
  hidden: { opacity: 1 },
  shown: { opacity: 0.55, transition: { delay: 0.75, duration: 0.5, ease } },
};

const strike: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { delay: 0.55, duration: 0.5, ease } },
};

/** The status-quo apps, appearing one by one and then struck through. */
export function StrikeChips({ items }: { items: string[] }) {
  return (
    <m.ul
      className="mt-12 flex flex-wrap justify-center gap-3"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.14 } } }}
    >
      {items.map((item, i) => (
        <m.li
          key={item + i}
          data-reveal
          variants={chip}
          className="relative rounded-full border border-line-strong bg-surface/60 px-5 py-2.5 text-sm font-medium text-fg"
        >
          <m.s data-reveal variants={label} className="no-underline">
            {item}
          </m.s>
          <m.span aria-hidden data-reveal variants={strike} className="absolute inset-x-3.5 top-1/2 h-px origin-left bg-fg-muted" />
        </m.li>
      ))}
    </m.ul>
  );
}
