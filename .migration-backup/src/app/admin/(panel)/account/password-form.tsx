'use client';

import { useActionState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { changePassword } from './actions';

export function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action] = useActionState(changePassword, idleState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <Card>
        <CardHeader title="Change password" description="Changing your password signs you out on your other devices." />
        <CardBody className="max-w-md space-y-5">
          {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
          <Field name="currentPassword" label="Current password" error={e.currentPassword} required>
            {(p) => <Input {...p} type="password" autoComplete="current-password" />}
          </Field>
          <Field name="newPassword" label="New password" hint={`At least ${minLength} characters. A short phrase works well.`} error={e.newPassword} required>
            {(p) => <Input {...p} type="password" autoComplete="new-password" minLength={minLength} />}
          </Field>
          <Field name="confirmPassword" label="Confirm new password" error={e.confirmPassword} required>
            {(p) => <Input {...p} type="password" autoComplete="new-password" />}
          </Field>
        </CardBody>
        <CardFooter>
          <SubmitButton pendingLabel="Saving">Change password</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
