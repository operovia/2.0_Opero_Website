'use client';

import { useActionState } from 'react';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { updateInquiry } from '../actions';

export function StatusForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [state, action] = useActionState(updateInquiry, idleState);
  const v = state.values ?? { status, notes };
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
      <Field name="status" label="Status">
        {(p) => (
          <Select {...p} defaultValue={v.status}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </Select>
        )}
      </Field>
      <Field name="notes" label="Notes" hint="Only visible here in the admin.">
        {(p) => <Textarea {...p} rows={6} defaultValue={v.notes} />}
      </Field>
      <SubmitButton pendingLabel="Saving">Save</SubmitButton>
    </form>
  );
}
