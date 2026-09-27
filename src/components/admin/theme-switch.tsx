'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';
import { setAdminTheme } from '@/app/admin/actions';
import { cn } from '@/lib/cn';
import type { AdminTheme } from '@/server/admin-theme';

const options: { value: AdminTheme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match system', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeSwitch({ current }: { current: AdminTheme }) {
  const [optimistic, setOptimistic] = useOptimistic(current);
  const [, startTransition] = useTransition();
  return (
    <div role="radiogroup" aria-label="Appearance" className="inline-flex rounded-full border border-line p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={optimistic === value}
          aria-label={label}
          title={label}
          onClick={() =>
            startTransition(async () => {
              setOptimistic(value);
              await setAdminTheme(value);
            })
          }
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-full transition-colors duration-150',
            optimistic === value ? 'bg-accent text-on-accent' : 'text-fg-muted hover:text-fg',
          )}
        >
          <Icon aria-hidden className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
