'use client';

import { useActionState } from 'react';
import { Field, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { addRecipientsAction } from '../../actions';

export function AddRecipientsForm({ surveyId }: { surveyId: string }) {
  const [state, action] = useActionState(addRecipientsAction, idleState);
  return (
    <form action={action} noValidate className="space-y-4">
      <input type="hidden" name="surveyId" value={surveyId} />
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
      <Field
        name="people"
        label="People"
        hint="For example: Jane Doe <jane@example.com>, or Jane Doe, jane@example.com, or just the address. Rows copied from a spreadsheet work too."
        error={state.fieldErrors?.people}
        required
      >
        {(p) => <Textarea {...p} rows={6} spellCheck={false} defaultValue={state.values?.people ?? ''} placeholder={'Jane Doe <jane@example.com>\njohn@example.com'} />}
      </Field>
      <SubmitButton pendingLabel="Adding">Add to the list</SubmitButton>
    </form>
  );
}
