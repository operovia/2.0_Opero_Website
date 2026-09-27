'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from './button';

type Props = ComponentProps<typeof Button> & { pendingLabel?: string };

/** A submit button that disables itself and shows progress while its form is submitting. */
export function SubmitButton({ children, pendingLabel, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
