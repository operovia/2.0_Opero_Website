import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-line-strong text-fg-muted',
  accent: 'border-transparent bg-accent text-on-accent',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  danger: 'border-danger/40 bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap', tones[tone], className)}
      {...props}
    />
  );
}
