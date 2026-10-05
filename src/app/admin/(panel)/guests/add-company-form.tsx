'use client';

import { useActionState } from 'react';
import { Field, Input, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { GREETING_MAX, GUEST_ROLE_LABELS, GUEST_ROLES } from '@/content/constants';
import { idleState } from '@/lib/forms';
import { addCompanyAction } from './actions';

/** Adds a company by its email domain. The field names differ from the guest form's, so the two forms' fields keep their own ids. */
export function AddCompanyForm() {
  const [state, action] = useActionState(addCompanyAction, idleState);
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
      <Field
        name="domain"
        label="Email domain"
        hint="What comes after the @ in their addresses, such as example.com. Pasting someone's address there works too."
        error={state.fieldErrors?.domain}
        required
      >
        {(p) => (
          <Input
            {...p}
            defaultValue={state.values?.domain ?? ''}
            placeholder="example.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
          />
        )}
      </Field>
      <Field
        name="companyRole"
        label="They may see"
        hint="Everyone who comes in through the company gets this. Changing it later changes it for all of them."
        error={state.fieldErrors?.companyRole}
        required
      >
        {(p) => (
          <Select {...p} defaultValue={state.values?.companyRole ?? 'visitor'}>
            {GUEST_ROLES.map((role) => (
              <option key={role} value={role}>
                {GUEST_ROLE_LABELS[role].label}: {GUEST_ROLE_LABELS[role].sees}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        name="companyGreeting"
        label="Welcome name"
        hint="The door and the home page greet everyone from the company by it, such as the firm's name."
        error={state.fieldErrors?.companyGreeting}
        optionalLabel="optional"
      >
        {(p) => <Input {...p} defaultValue={state.values?.companyGreeting ?? ''} maxLength={GREETING_MAX} autoComplete="off" />}
      </Field>
      <Field
        name="companyNote"
        label="Note"
        hint="A reminder to yourself of who they are. Only you see it."
        error={state.fieldErrors?.companyNote}
        optionalLabel="optional"
      >
        {(p) => <Input {...p} defaultValue={state.values?.companyNote ?? ''} maxLength={200} />}
      </Field>
      <SubmitButton pendingLabel="Adding">Add the company</SubmitButton>
    </form>
  );
}
