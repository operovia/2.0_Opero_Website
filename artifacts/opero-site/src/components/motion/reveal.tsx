'use client';

import { m, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { tokens } from '@/theme/tokens';

const { duration, ease, revealDistance } = tokens.motion;

const item: Variants = {
  hidden: { opacity: 0, y: revealDistance },
  shown: { opacity: 1, y: 0, transition: { duration: duration.reveal / 1000, ease: ease.out } },
};

type Props = { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'section' | 'p' };

/**
 * Fades and lifts its content into place the first time it scrolls into view.
 * Marked with data-reveal so it stays visible when JavaScript is off.
 */
export function Reveal({ children, className, delay = 0, as = 'div' }: Props) {
  const Tag = m[as];
  return (
    <Tag
      data-reveal
      className={className}
      variants={item}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

/** Reveals its RevealItem children one after another. */
export function RevealGroup({ children, className, stagger = 0.08, as = 'div' }: { children: ReactNode; className?: string; stagger?: number; as?: 'div' | 'ul' | 'ol' }) {
  const Tag = m[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Tag = m[as];
  return (
    <Tag data-reveal className={className} variants={item}>
      {children}
    </Tag>
  );
}
