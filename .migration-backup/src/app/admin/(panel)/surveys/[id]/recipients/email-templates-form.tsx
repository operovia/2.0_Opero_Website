'use client';

import { useActionState, useState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { fillMergeTags, mergeTagHelp } from '@/surveys/merge';
import { saveEmailTemplatesAction } from '../../actions';

type Values = { inviteSubject: string; inviteMessage: string; reminderSubject: string; reminderMessage: string };

type Props = { surveyId: string; surveyTitle: string; sampleName: string; values: Values };

export function EmailTemplatesForm({ surveyId, surveyTitle, sampleName, values: saved }: Props) {
  const [state, action] = useActionState(saveEmailTemplatesAction, idleState);
  const e = state.fieldErrors ?? {};
  const initial = (state.values as Values | undefined) ?? saved;
  // Live copies of the fields, only for the previews.
  const [draft, setDraft] = useState(initial);
  const set = (key: keyof Values) => (event: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: event.target.value }));

  return (
    <form action={action} noValidate>
      <input type="hidden" name="surveyId" value={surveyId} />
      <Card>
        <CardHeader title="Email wording" description={`${mergeTagHelp} Each email ends with a button to the person's own link.`} />
        <CardBody className="space-y-8">
          {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {(['invite', 'reminder'] as const).map((kind) => {
              const subjectKey = `${kind}Subject` as const;
              const messageKey = `${kind}Message` as const;
              return (
                <fieldset key={kind} className="space-y-5">
                  <legend className="mb-4 text-base font-semibold text-fg">{kind === 'invite' ? 'Invitation' : 'Reminder'}</legend>
                  <Field name={subjectKey} label="Subject" error={e[subjectKey]} required>
                    {(p) => <Input {...p} defaultValue={initial[subjectKey]} onChange={set(subjectKey)} maxLength={200} />}
                  </Field>
                  <Field name={messageKey} label="Message" hint="Leave a blank line between paragraphs." error={e[messageKey]} required>
                    {(p) => <Textarea {...p} rows={7} defaultValue={initial[messageKey]} onChange={set(messageKey)} />}
                  </Field>
                  <div className="rounded-lg border border-line bg-canvas-raised p-4 text-sm">
                    <p className="text-eyebrow font-semibold text-fg-subtle uppercase">Preview for {sampleName}</p>
                    <p className="mt-2 font-semibold text-fg">{fillMergeTags(draft[subjectKey], { name: sampleName, survey: surveyTitle }) || surveyTitle}</p>
                    <p className="mt-2 whitespace-pre-line text-fg-muted">{fillMergeTags(draft[messageKey], { name: sampleName, survey: surveyTitle })}</p>
                  </div>
                </fieldset>
              );
            })}
          </div>
        </CardBody>
        <CardFooter>
          <SubmitButton pendingLabel="Saving">Save email wording</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
