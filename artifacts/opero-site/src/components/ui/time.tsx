'use client';

import { useSyncExternalStore } from 'react';

type Format = 'datetime' | 'date' | 'relative';

const subscribe = () => () => {};

function formatValue(date: Date, format: Format, timeZone?: string): string {
  if (format === 'relative') {
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ['year', 31_536_000],
      ['month', 2_592_000],
      ['week', 604_800],
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
    ];
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...(format === 'datetime' ? { timeStyle: 'short' } : {}),
    timeZone,
  }).format(date);
}

/**
 * A timestamp shown in the viewer's own time zone. The server renders UTC,
 * and the browser swaps in local time after hydration.
 */
export function Time({ value, format = 'datetime' }: { value: Date | string; format?: Format }) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const text = isClient ? formatValue(date, format) : formatValue(date, format === 'relative' ? 'datetime' : format, 'UTC');
  return (
    <time dateTime={date.toISOString()} title={isClient ? formatValue(date, 'datetime') : undefined}>
      {text}
    </time>
  );
}
