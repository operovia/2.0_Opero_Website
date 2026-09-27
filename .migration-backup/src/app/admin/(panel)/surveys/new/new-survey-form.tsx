'use client';

import { useActionState, useState } from 'react';
import { Card, CardBody, CardFooter } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { slugify } from '@/surveys/questions';
import { createSurveyAction } from '../actions';

export function NewSurveyForm({ base }: { base: string }) {
  const [state, action] = useActionState(createSurveyAction, idleState);
  const e = state.fieldErrors ?? {};
  const [title, setTitle] = useState(state.values?.title ?? '');
  const [slug, setSlug] = useState(state.values?.slug ?? '');
  // The address follows the title until someone edits it by hand.
  const [slugEdited, setSlugEdited] = useState(Boolean(state.values?.slug));
  const shownSlug = slugEdited ? slug : slugify(title);

  return (
    <form action={action} noValidate>
      <Card>
        <CardBody className="space-y-6">
          {state.status === 'error' && state.message ? <Notice tone="danger">{state.message}</Notice> : null}
          <Field name="title" label="Title" hint="Respondents see this at the top of the survey and in the email subject." error={e.title} required>
            {(p) => <Input {...p} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoFocus />}
          </Field>
          <Field
            name="slug"
            label="Web address"
            hint={
              <>
                The survey will be at <span className="font-medium break-all text-fg">{base + (shownSlug || 'your-survey')}</span>. Lowercase letters, numbers,
                and hyphens.
              </>
            }
            error={e.slug}
            required
          >
            {(p) => (
              <Input
                {...p}
                value={shownSlug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                maxLength={60}
                spellCheck={false}
                autoCapitalize="none"
              />
            )}
          </Field>
        </CardBody>
        <CardFooter>
          <SubmitButton pendingLabel="Creating">Create survey</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
