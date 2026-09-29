'use client';

import { CircleCheck } from 'lucide-react';
import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { SpamTraps, stampElapsed } from '@/components/site/spam-traps';
import { Input, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/cn';
import { answerField, NPS_SCALE, RATING_SCALE, TEXT_LIMITS, type SurveyQuestion } from '@/surveys/types';
import { markSurveyOpened, submitSurvey, type SurveyFormState } from './actions';

type Props = {
  surveyId: string;
  token: string | null;
  preview: boolean;
  title: string;
  intro: ReactNode;
  thankYou: ReactNode;
  questions: SurveyQuestion[];
};

const idle: SurveyFormState = { status: 'idle' };

export function SurveyForm({ surveyId, token, preview, title, intro, thankYou, questions }: Props) {
  const [state, action] = useActionState(submitSurvey, idle);
  const summary = useRef<HTMLDivElement>(null);
  const thanks = useRef<HTMLHeadingElement>(null);
  const errors = state.errors ?? {};
  const echo = state.echo ?? {};
  const finished = state.status === 'submitted' || state.status === 'duplicate';

  // The link counts as opened once the page is shown in a browser, not when a mail scanner fetches it.
  useEffect(() => {
    if (token && !preview) void markSurveyOpened(token);
  }, [token, preview]);

  useEffect(() => {
    if (state.status === 'error') summary.current?.focus();
    if (finished) {
      window.scrollTo({ top: 0 });
      thanks.current?.focus();
    }
  }, [state, finished]);

  if (finished) {
    return (
      <section aria-labelledby="survey-thanks" className="flex flex-col gap-6">
        <p className="text-sm text-fg-subtle">{title}</p>
        <CircleCheck className="size-10 text-success" aria-hidden />
        <h1 id="survey-thanks" ref={thanks} tabIndex={-1} className="text-display-sm font-medium text-metal outline-none">
          {state.status === 'duplicate' ? 'You have already responded' : 'Thank you'}
        </h1>
        {thankYou}
        {preview ? <p className="text-sm text-fg-subtle">Preview: nothing was saved.</p> : null}
      </section>
    );
  }

  const withErrors = questions.map((q, i) => ({ q, number: i + 1 })).filter(({ q }) => errors[q.id]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5">
        <h1 className="text-display-sm font-medium text-metal">{title}</h1>
        {intro}
      </header>

      <form action={action} onSubmit={(event) => stampElapsed(event.currentTarget)} noValidate className="space-y-10">
        <input type="hidden" name="survey" value={surveyId} />
        {token ? <input type="hidden" name="t" value={token} /> : null}
        {preview ? <input type="hidden" name="preview" value="1" /> : null}
        <SpamTraps />

        {state.status === 'error' ? (
          <div ref={summary} tabIndex={-1} role="alert" className="space-y-2 rounded-lg border border-danger/40 bg-danger-soft px-5 py-4 text-sm text-fg outline-none">
            <p className="font-semibold">{state.message}</p>
            {withErrors.length ? (
              <ul className="space-y-1">
                {withErrors.map(({ q, number }) => (
                  <li key={q.id}>
                    <a href={`#question-${q.id}`} className="underline underline-offset-4">
                      Question {number}: {errors[q.id]}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {questions.length ? (
          <ol className="space-y-12">
            {questions.map((question, index) => (
              <li key={question.id}>
                <Question question={question} number={index + 1} error={errors[question.id]} value={echo[question.id]} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-fg-muted">This survey has no questions yet.</p>
        )}

        <div className="border-t border-line pt-8">
          <SubmitButton size="lg" pendingLabel="Sending" disabled={!questions.length}>
            Submit
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

type QuestionProps = { question: SurveyQuestion; number: number; error?: string; value?: string | string[] };

function Question({ question, number, error, value }: QuestionProps) {
  const id = `question-${question.id}`;
  const name = answerField(question.id);
  const scaleNote =
    question.type === 'nps' ? '0 is not at all likely, 10 is extremely likely.' : question.type === 'rating' ? '1 is the lowest, 5 the highest.' : '';
  const describedBy = [question.helpText ? `${id}-help` : '', scaleNote ? `${id}-scale` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

  const heading = (
    <>
      <span className="mr-2 text-fg-subtle tabular-nums">{number}.</span>
      {question.prompt}
      {question.required ? <span className="ml-2 text-sm font-normal text-fg-subtle">Required</span> : null}
    </>
  );
  const help = question.helpText ? (
    <p id={`${id}-help`} className="text-base text-fg-muted">
      {question.helpText}
    </p>
  ) : null;
  const errorText = error ? (
    <p id={`${id}-error`} className="text-sm font-medium text-danger">
      {error}
    </p>
  ) : null;

  if (question.type === 'short_text' || question.type === 'long_text') {
    const control = {
      id: `${id}-answer`,
      name,
      defaultValue: typeof value === 'string' ? value : '',
      maxLength: TEXT_LIMITS[question.type],
      'aria-describedby': describedBy,
      'aria-invalid': error ? (true as const) : undefined,
      'aria-required': question.required || undefined,
    };
    return (
      <div id={id} className="scroll-mt-8 space-y-3">
        <label htmlFor={control.id} className="block text-xl font-semibold text-fg">
          {heading}
        </label>
        {help}
        {question.type === 'short_text' ? <Input {...control} /> : <Textarea {...control} rows={5} />}
        {errorText}
      </div>
    );
  }

  const choices =
    question.type === 'single_choice' || question.type === 'multiple_choice'
      ? question.options.map((o) => ({ value: o.id, label: o.label }))
      : question.type === 'yes_no'
        ? [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]
        : (question.type === 'nps' ? NPS_SCALE : RATING_SCALE).map((n) => ({ value: String(n), label: String(n) }));
  const multiple = question.type === 'multiple_choice';
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);
  const boxes = question.type === 'rating' || question.type === 'nps' || question.type === 'yes_no';

  return (
    <fieldset id={id} aria-describedby={describedBy} className="scroll-mt-8">
      <legend className="mb-3 block text-xl font-semibold text-fg">{heading}</legend>
      <div className="space-y-4">
        {help}
        {multiple ? <p className="text-sm text-fg-subtle">Choose all that apply.</p> : null}
        {boxes ? (
          <div
            className={cn(
              'grid gap-2',
              question.type === 'nps' ? 'grid-cols-6 sm:grid-cols-11' : question.type === 'rating' ? 'grid-cols-5 sm:max-w-md' : 'grid-cols-2 sm:max-w-xs',
            )}
          >
            {choices.map((choice) => (
              <label
                key={choice.value}
                className="flex h-12 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-surface text-base font-semibold text-fg transition-colors duration-150 hover:border-fg-subtle has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring"
              >
                <input type="radio" name={name} value={choice.value} defaultChecked={selected(choice.value)} className="sr-only" />
                {choice.label}
              </label>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {choices.map((choice) => (
              <label
                key={choice.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-strong bg-surface px-4 py-3.5 text-base text-fg transition-colors duration-150 hover:border-fg-subtle has-checked:border-fg has-checked:bg-surface-raised"
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={name}
                  value={choice.value}
                  defaultChecked={selected(choice.value)}
                  className="size-4 shrink-0 accent-[var(--o-accent)]"
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        )}
        {scaleNote ? (
          <p id={`${id}-scale`} className="text-sm text-fg-subtle">
            {scaleNote}
          </p>
        ) : null}
        {errorText}
      </div>
    </fieldset>
  );
}
