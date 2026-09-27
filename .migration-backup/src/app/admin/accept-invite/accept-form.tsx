'use client';

import { useActionState } from 'react';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { acceptInvite } from './actions';

export function AcceptForm({ token, email, name, minLength }: { token: string; email: string; name: string; minLength: number }) {
  const [state, action] = useActionState(acceptInvite, idleState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Notice tone="danger">{state.message}</Notice> : null}
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-fg">Email</p>
        <p className="text-base text-fg-muted">{email}</p>
      </div>
      <Field name="name" label="Your name" error={e.name} required>
        {(p) => <Input {...p} autoComplete="name" defaultValue={state.values?.name ?? name} />}
      </Field>
      <Field name="password" label="Choose a password" hint={`At least ${minLength} characters.`} error={e.password} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" minLength={minLength} />}
      </Field>
      <Field name="confirmPassword" label="Confirm password" error={e.confirmPassword} required>
        {(p) => <Input {...p} type="password" autoComplete="new-password" />}
      </Field>
      <SubmitButton className="w-full" size="lg" pendingLabel="Creating account">
        Create account
      </SubmitButton>
    </form>
  );
}
