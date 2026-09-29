'use client';

import {
  BookOpen,
  CalendarDays,
  CirclePlay,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  KeyRound,
  Mail,
  Megaphone,
  MessageSquare,
  Sheet,
  SquareKanban,
  StickyNote,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { m, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

const { duration, ease } = tokens.motion;
const settle = { duration: duration.reveal / 1000, ease: ease.out };

/** The line the two columns hang from, drawn left to right as it scrolls into view. Wide screens only. */
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

/** App icons: rounded squares, their corners about a fifth of their size. */
const tiles = {
  sm: { box: 'size-9 rounded-sm', icon: 'size-4' },
  md: { box: 'size-11 rounded-md', icon: 'size-5' },
  lg: { box: 'size-13 rounded-md', icon: 'size-6' },
} as const;

/**
 * The problem: a cloud of apps, one for everything and none of them joined.
 * Generic icons for the kinds of tools the site names (a board tool, a wiki,
 * a training platform, an EOS tool, a listing marketing tool) and the rest of
 * the sprawl, never a real product's logo. Positions are shares of the
 * picture's width and height; faint ones sit further back, and a few carry
 * an unread badge, the way they all ask for attention.
 */
const apps: { icon: LucideIcon; x: number; y: number; size: keyof typeof tiles; tilt: string; faint?: boolean; badge?: boolean }[] = [
  { icon: SquareKanban, x: 0, y: 50, size: 'lg', tilt: '-rotate-6' },
  { icon: Sheet, x: 11, y: 6, size: 'md', tilt: 'rotate-3' },
  { icon: StickyNote, x: 17, y: 62, size: 'sm', tilt: 'rotate-6', faint: true },
  { icon: BookOpen, x: 25, y: 30, size: 'md', tilt: '-rotate-3' },
  { icon: GraduationCap, x: 34, y: 68, size: 'md', tilt: 'rotate-2' },
  { icon: Mail, x: 38, y: 2, size: 'sm', tilt: '-rotate-12', badge: true },
  { icon: CirclePlay, x: 46, y: 38, size: 'lg', tilt: 'rotate-6' },
  { icon: Target, x: 57, y: 6, size: 'md', tilt: '-rotate-6' },
  { icon: CalendarDays, x: 61, y: 70, size: 'sm', tilt: 'rotate-12', faint: true },
  { icon: Megaphone, x: 68, y: 34, size: 'md', tilt: 'rotate-3' },
  { icon: KeyRound, x: 76, y: 0, size: 'sm', tilt: 'rotate-6' },
  { icon: MessageSquare, x: 80, y: 62, size: 'md', tilt: '-rotate-3', badge: true },
  { icon: ClipboardList, x: 87, y: 22, size: 'lg', tilt: '-rotate-6', badge: true },
  { icon: FolderOpen, x: 93, y: 68, size: 'sm', tilt: 'rotate-3', faint: true },
];

const drift: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  shown: ({ i, faint }: { i: number; faint?: boolean }) => ({ opacity: faint ? 0.55 : 1, y: 0, scale: 1, transition: { ...settle, delay: 0.1 + i * 0.05 } }),
};

export function AppCloud({ className }: { className?: string }) {
  return (
    <m.div aria-hidden className={cn('relative', className)} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.5 }}>
      {apps.map(({ icon: Icon, x, y, size, tilt, faint, badge }, i) => (
        <m.span
          key={i}
          data-reveal
          custom={{ i, faint }}
          variants={drift}
          className={cn('absolute grid place-items-center border border-line-strong bg-surface text-fg-subtle shadow-md', tiles[size].box, tilt)}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <Icon className={tiles[size].icon} strokeWidth={1.75} />
          {badge ? <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger ring-2 ring-canvas" /> : null}
        </m.span>
      ))}
    </m.div>
  );
}
