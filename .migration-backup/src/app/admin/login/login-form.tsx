'use client';

import { useActionState } from 'react';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { login } from './actions';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, idleState);
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === 'error' && state.message ? <Notice tone="danger">{state.message}</Notice> : null}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field name="email" label="Email" error={state.fieldErrors?.email} required>
        {(props) => (
          <Input {...props} type="email" autoComplete="username" autoFocus defaultValue={state.values?.email ?? ''} />
        )}
      </Field>
      <Field name="password" label="Password" error={state.fieldErrors?.password} required>
        {(props) => <Input {...props} type="password" autoComplete="current-password" />}
      </Field>
      <SubmitButton className="w-full" size="lg" pendingLabel="Signing in">
        Sign in
      </SubmitButton>
    </form>
  );
}
