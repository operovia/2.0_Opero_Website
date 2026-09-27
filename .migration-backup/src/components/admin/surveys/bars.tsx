import { cn } from '@/lib/cn';
import type { Bar } from '@/surveys/stats';

const pct = (value: number) => `${Math.round(value)}%`;

/**
 * Horizontal bars for a question's answers. Each row states its count and
 * share in text; the bar itself is decoration.
 */
export function Bars({ bars, tone }: { bars: Bar[]; tone?: (bar: Bar) => 'success' | 'warning' | 'danger' | undefined }) {
  return (
    <ul className="space-y-3">
      {bars.map((bar) => {
        const color = tone?.(bar);
        return (
          <li key={bar.key} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_6rem] sm:items-center sm:gap-4">
            <span className="text-sm text-fg">{bar.label}</span>
            <span aria-hidden className="block h-2.5 overflow-hidden rounded-full bg-surface-raised">
              <span
                className={cn('block h-full rounded-full', color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : color === 'danger' ? 'bg-danger' : 'bg-accent')}
                style={{ width: `${Math.max(bar.percent, bar.count ? 1 : 0)}%` }}
              />
            </span>
            <span className="text-sm text-fg-muted tabular-nums sm:text-right">
              {bar.count.toLocaleString('en-US')} · {pct(bar.percent)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
