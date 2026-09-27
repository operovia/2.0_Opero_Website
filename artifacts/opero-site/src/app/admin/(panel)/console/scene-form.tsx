'use client';

import { useActionState } from 'react';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { saveScene } from './actions';

export type SceneValues = {
  id?: string;
  question: string;
  thinkingMs: number;
  answerTag: string;
  answerMain: string;
  answerSupport: string;
  chips: string[];
};

const blank: SceneValues = { question: '', thinkingMs: 1200, answerTag: '', answerMain: '', answerSupport: '', chips: [] };

/** Adds a new scene, or edits one when `scene` is given. */
export function SceneForm({ scene }: { scene?: SceneValues }) {
  const [state, action] = useActionState(saveScene, idleState);
  const e = state.fieldErrors ?? {};
  const saved = scene ?? blank;
  const v = state.values ?? {
    question: saved.question,
    thinkingMs: String(saved.thinkingMs),
    answerTag: saved.answerTag,
    answerMain: saved.answerMain,
    answerSupport: saved.answerSupport,
    chip1: saved.chips[0] ?? '',
    chip2: saved.chips[1] ?? '',
    chip3: saved.chips[2] ?? '',
    chip4: saved.chips[3] ?? '',
  };
  const prefix = scene?.id ? `scene-${scene.id.slice(0, 8)}-` : 'new-scene-';

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}
      {scene?.id ? <input type="hidden" name="id" value={scene.id} /> : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field name={`${prefix}question`} label="Question" error={e.question} required>
          {(p) => <Input {...p} name="question" defaultValue={v.question} maxLength={200} />}
        </Field>
        <Field name={`${prefix}thinkingMs`} label="Thinking delay" hint="In milliseconds." error={e.thinkingMs} required>
          {(p) => <Input {...p} name="thinkingMs" type="number" min={200} max={6000} step={100} defaultValue={v.thinkingMs} />}
        </Field>
      </div>
      <Field name={`${prefix}answerTag`} label="Answer tag" optionalLabel="(optional)" hint="Small capitals above the answer, such as the building and suite." error={e.answerTag}>
        {(p) => <Input {...p} name="answerTag" defaultValue={v.answerTag} maxLength={80} />}
      </Field>
      <Field name={`${prefix}answerMain`} label="Main answer" error={e.answerMain} required>
        {(p) => <Input {...p} name="answerMain" defaultValue={v.answerMain} maxLength={120} />}
      </Field>
      <Field name={`${prefix}answerSupport`} label="Supporting line" optionalLabel="(optional)" error={e.answerSupport}>
        {(p) => <Textarea {...p} name="answerSupport" rows={2} defaultValue={v.answerSupport} maxLength={240} />}
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">
          Chips <span className="font-normal text-fg-subtle">(up to four, optional)</span>
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(['chip1', 'chip2', 'chip3', 'chip4'] as const).map((name, i) => (
            <Input key={name} name={name} aria-label={`Chip ${i + 1}`} defaultValue={v[name]} maxLength={60} />
          ))}
        </div>
      </fieldset>
      <SubmitButton pendingLabel="Saving">{scene?.id ? 'Save scene' : 'Add scene'}</SubmitButton>
    </form>
  );
}
