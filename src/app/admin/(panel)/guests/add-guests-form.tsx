'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { GUEST_ROLE_LABELS, GUEST_ROLES } from '@/content/constants';
import { idleState } from '@/lib/forms';
import { addGuestsAction } from './actions';

export function AddGuestsForm() {
  const [state, action] = useActionState(addGuestsAction, idleState);
  return (
    <form action={action} noValidate className="space-y-4">
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
      <Field
        name="people"
        label="Email addresses"
        hint="One person per line. For example: Jane Doe <jane@example.com>, or Jane Doe, jane@example.com, or just the address. Rows copied from a spreadsheet work too."
        error={state.fieldErrors?.people}
        required
      >
        {(p) => (
          <Textarea
            {...p}
            rows={5}
            spellCheck={false}
            defaultValue={state.values?.people ?? ''}
            placeholder={'Jane Doe <jane@example.com>\njohn@example.com'}
          />
        )}
      </Field>
      <Field
        name="role"
        label="They may see"
        hint="A visitor sees the site. An investor sees the site and the Data Room. You can change this later from the list."
        error={state.fieldErrors?.role}
        required
      >
        {(p) => (
          <Select {...p} defaultValue={state.values?.role ?? 'visitor'}>
            {GUEST_ROLES.map((role) => (
              <option key={role} value={role}>
                {GUEST_ROLE_LABELS[role].label}: {GUEST_ROLE_LABELS[role].sees}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field name="note" label="Note" hint="A reminder to yourself of who they are. Only you see it." error={state.fieldErrors?.note} optionalLabel="optional">
        {(p) => <Input {...p} defaultValue={state.values?.note ?? ''} maxLength={200} />}
      </Field>
      <SubmitButton pendingLabel="Adding">Add to the list</SubmitButton>
    </form>
  );
}
