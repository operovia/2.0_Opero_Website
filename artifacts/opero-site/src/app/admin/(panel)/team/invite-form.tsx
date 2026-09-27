'use client';

import { useActionState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { inviteAdmin } from './actions';

export function InviteForm() {
  const [state, action] = useActionState(inviteAdmin, idleState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate>
      <Card>
        <CardHeader title="Invite an admin" description="They receive an email with a one-time link to set a password. The link expires in 7 days." />
        <CardBody className="space-y-5">
          {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field name="name" label="Name" optionalLabel="(optional)" error={e.name}>
              {(p) => <Input {...p} autoComplete="off" defaultValue={state.values?.name ?? ''} />}
            </Field>
            <Field name="email" label="Email" error={e.email} required>
              {(p) => <Input {...p} type="email" autoComplete="off" defaultValue={state.values?.email ?? ''} />}
            </Field>
          </div>
        </CardBody>
        <CardFooter>
          <SubmitButton pendingLabel="Sending">Send invitation</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
