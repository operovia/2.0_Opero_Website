'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from './button';

/** A submit button that asks for confirmation before its form submits. */
export function ConfirmSubmit({ confirm, children, ...props }: ComponentProps<typeof Button> & { confirm: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
