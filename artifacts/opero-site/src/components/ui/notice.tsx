import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  info: 'border-line-strong bg-surface-raised text-fg',
  success: 'border-success/40 bg-success-soft text-fg',
  warning: 'border-warning/40 bg-warning-soft text-fg',
  danger: 'border-danger/40 bg-danger-soft text-fg',
};

/** An inline message. Errors are announced immediately; everything else politely. */
export function Notice({ tone = 'info', title, children, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-lg border px-4 py-3 text-sm', tones[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1', 'text-fg-muted')}>{children}</div> : null}
    </div>
  );
}
