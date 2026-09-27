'use client';

import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Switch } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { cn } from '@/lib/cn';
import { newId } from '@/surveys/questions';
import { hasOptions, questionTypeLabels, questionTypes, type QuestionType, type SurveyOption, type SurveyQuestion } from '@/surveys/types';
import { saveQuestionsAction, type ActionResult } from '../actions';

type Props = { surveyId: string; initial: SurveyQuestion[]; responses: number; previewHref: string };

const MAX_OPTIONS = 30;

const blankOption = (): SurveyOption => ({ id: newId(), label: '' });

function blankQuestion(type: QuestionType): SurveyQuestion {
  return { id: `new-${newId()}`, type, prompt: '', helpText: '', required: false, options: hasOptions(type) ? [blankOption(), blankOption()] : [] };
}

/** What would be saved, so unsaved changes can be detected. */
const canonical = (questions: SurveyQuestion[]) =>
  JSON.stringify(questions.map((q) => ({ ...q, prompt: q.prompt.trim(), helpText: q.helpText.trim(), options: hasOptions(q.type) ? q.options.map((o) => ({ ...o, label: o.label.trim() })) : [] })));

const scaleNotes: Partial<Record<QuestionType, string>> = {
  short_text: 'People answer in a single line, up to 500 characters.',
  long_text: 'People answer in a paragraph, up to 5,000 characters.',
  rating: 'People choose a number from 1 to 5.',
  nps: 'People choose from 0 (not at all likely) to 10 (extremely likely). Results show the Net Promoter Score.',
  yes_no: 'People choose yes or no.',
};

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function QuestionBuilder({ surveyId, initial, responses, previewHref }: Props) {
  const router = useRouter();
  const locked = responses > 0;
  const [questions, setQuestions] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const focusNext = useRef<string | null>(null);

  const unsaved = canonical(questions) !== canonical(saved);

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // Put the cursor in a question just added.
  useEffect(() => {
    if (!focusNext.current) return;
    document.getElementById(`question-${focusNext.current}-prompt`)?.focus();
    focusNext.current = null;
  }, [questions]);

  const update = (index: number, patch: Partial<SurveyQuestion>) => setQuestions((list) => list.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const add = (type: QuestionType) => {
    const question = blankQuestion(type);
    focusNext.current = question.id;
    setQuestions((list) => [...list, question]);
  };

  const save = (after?: (ok: boolean) => void) => {
    // Clear the last message, so it never looks like this save has already finished.
    setResult(null);
    startTransition(async () => {
      const r = await saveQuestionsAction(surveyId, questions);
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok && r.questions) {
        setQuestions(r.questions);
        setSaved(r.questions);
      }
      after?.(r.ok);
      router.refresh();
    });
  };

  const preview = () => {
    if (!unsaved) {
      window.open(previewHref, '_blank', 'noopener');
      return;
    }
    // Open the tab now (browsers block pop-ups opened after an await), then save and point it at the preview.
    const tab = window.open('about:blank', '_blank');
    save((ok) => {
      if (ok && tab) tab.location.href = previewHref;
      else tab?.close();
    });
  };

  const discard = () => {
    if (!window.confirm('Discard your changes and go back to the saved questions?')) return;
    setQuestions(saved);
    setErrors({});
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {locked ? (
        <Notice tone="warning" title="Only wording can change now">
          This survey has {responses === 1 ? 'a response' : `${responses.toLocaleString('en-US')} responses`}, so questions cannot be added, removed, reordered, or
          changed in type, and options cannot be added or removed. You can still edit question text, help text, and option labels. To restructure the survey,
          delete its responses in Settings first.
        </Notice>
      ) : null}
      {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}

      {questions.length ? (
        <ol aria-label="Questions" className="space-y-5">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              total={questions.length}
              locked={locked}
              errors={errors}
              onChange={(patch) => update(index, patch)}
              onMove={(to) => setQuestions((list) => move(list, index, to))}
              onRemove={() => {
                if (question.prompt.trim() && !window.confirm(`Delete question ${index + 1}? It is removed when you save.`)) return;
                setQuestions((list) => list.filter((_, i) => i !== index));
              }}
            />
          ))}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
          <p className="font-medium text-fg">No questions yet</p>
          <p className="mt-1 text-sm text-fg-muted">Choose a type of question below to add the first one.</p>
        </div>
      )}

      {!locked ? (
        <section aria-labelledby="add-question" className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <h2 id="add-question" className="text-sm font-semibold text-fg">
            Add a question
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {questionTypes.map((type) => (
              <Button key={type} variant="secondary" size="sm" onClick={() => add(type)} disabled={questions.length >= 100}>
                <Plus className="size-4" aria-hidden />
                {questionTypeLabels[type]}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-5 py-4 shadow-md backdrop-blur">
        <div className="flex items-center gap-3">
          {unsaved ? <Badge tone="warning">Unsaved changes</Badge> : <Badge tone="success">Saved</Badge>}
          <Button variant="ghost" size="sm" onClick={discard} disabled={pending || !unsaved}>
            Discard changes
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={preview} disabled={pending || !questions.length}>
            <ExternalLink className="size-4" aria-hidden />
            Preview
          </Button>
          <Button onClick={() => save()} disabled={pending || !unsaved} aria-busy={pending || undefined}>
            {pending ? 'Saving' : 'Save questions'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  question: SurveyQuestion;
  index: number;
  total: number;
  locked: boolean;
  errors: Record<string, string>;
  onChange: (patch: Partial<SurveyQuestion>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
};

function QuestionCard({ question, index, total, locked, errors, onChange, onMove, onRemove }: CardProps) {
  const id = `question-${question.id}`;
  const number = index + 1;
  const promptError = errors[`${index}.prompt`];
  const helpError = errors[`${index}.helpText`];
  const optionErrors = Object.entries(errors).filter(([key]) => key.startsWith(`${index}.options`));

  const setType = (type: QuestionType) => {
    // Choice questions need at least two options to start from.
    const options = hasOptions(type) && question.options.length < 2 ? [...question.options, ...Array.from({ length: 2 - question.options.length }, blankOption)] : question.options;
    onChange({ type, options });
  };

  return (
    <li className="rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="text-sm font-semibold text-fg">
          Question {number}
          <span className="font-normal text-fg-muted"> · {questionTypeLabels[question.type]}</span>
          {question.required ? <span className="font-normal text-fg-muted"> · Required</span> : null}
        </h2>
        {!locked ? (
          <div className="flex items-center gap-1">
            <IconButton label={`Move question ${number} up`} disabled={index === 0} onClick={() => onMove(index - 1)}>
              <ArrowUp className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Move question ${number} down`} disabled={index === total - 1} onClick={() => onMove(index + 1)}>
              <ArrowDown className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete question ${number}`} onClick={onRemove} danger>
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Block id={`${id}-prompt`} label="Question" error={promptError}>
            <Input
              id={`${id}-prompt`}
              value={question.prompt}
              onChange={(event) => onChange({ prompt: event.target.value })}
              maxLength={500}
              aria-invalid={promptError ? true : undefined}
              aria-describedby={promptError ? `${id}-prompt-error` : undefined}
            />
          </Block>
          <Block id={`${id}-type`} label="Type">
            <Select id={`${id}-type`} value={question.type} onChange={(event) => setType(event.target.value as QuestionType)} disabled={locked}>
              {questionTypes.map((type) => (
                <option key={type} value={type}>
                  {questionTypeLabels[type]}
                </option>
              ))}
            </Select>
          </Block>
        </div>

        <Block id={`${id}-help`} label="Help text" optional error={helpError}>
          <Input
            id={`${id}-help`}
            value={question.helpText}
            onChange={(event) => onChange({ helpText: event.target.value })}
            maxLength={1000}
            placeholder="A hint shown under the question"
            aria-invalid={helpError ? true : undefined}
          />
        </Block>

        {hasOptions(question.type) ? (
          <OptionsEditor
            questionId={id}
            number={number}
            options={question.options}
            locked={locked}
            invalid={(j) => Boolean(errors[`${index}.options.${j}.label`])}
            error={optionErrors[0]?.[1]}
            onChange={(options) => onChange({ options })}
          />
        ) : (
          <p className="text-sm text-fg-muted">{scaleNotes[question.type]}</p>
        )}

        <Switch
          id={`${id}-required`}
          label="Required"
          description={locked ? 'Cannot change once the survey has responses.' : 'People must answer this question to submit the survey.'}
          checked={question.required}
          onChange={(event) => onChange({ required: event.target.checked })}
          disabled={locked}
        />
      </div>
    </li>
  );
}

function OptionsEditor({
  questionId,
  number,
  options,
  locked,
  invalid,
  error,
  onChange,
}: {
  questionId: string;
  number: number;
  options: SurveyOption[];
  locked: boolean;
  invalid: (index: number) => boolean;
  error?: string;
  onChange: (options: SurveyOption[]) => void;
}) {
  const legendId = useId();
  return (
    <fieldset className="space-y-2" aria-describedby={error ? `${questionId}-options-error` : undefined}>
      <legend id={legendId} className="mb-2 text-sm font-medium text-fg">
        Options
      </legend>
      <ol className="space-y-2">
        {options.map((option, j) => (
          <li key={option.id} className="flex items-center gap-2">
            <span aria-hidden className="w-6 shrink-0 text-right text-sm text-fg-subtle tabular-nums">
              {j + 1}.
            </span>
            <Input
              aria-label={`Question ${number}, option ${j + 1}`}
              value={option.label}
              onChange={(event) => onChange(options.map((o, k) => (k === j ? { ...o, label: event.target.value } : o)))}
              maxLength={200}
              aria-invalid={invalid(j) ? true : undefined}
            />
            {!locked ? (
              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton label={`Move option ${j + 1} up`} disabled={j === 0} onClick={() => onChange(move(options, j, j - 1))}>
                  <ArrowUp className="size-4" aria-hidden />
                </IconButton>
                <IconButton label={`Move option ${j + 1} down`} disabled={j === options.length - 1} onClick={() => onChange(move(options, j, j + 1))}>
                  <ArrowDown className="size-4" aria-hidden />
                </IconButton>
                <IconButton label={`Remove option ${j + 1}`} disabled={options.length <= 2} onClick={() => onChange(options.filter((_, k) => k !== j))}>
                  <X className="size-4" aria-hidden />
                </IconButton>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {error ? (
        <p id={`${questionId}-options-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {!locked && options.length < MAX_OPTIONS ? (
        <button
          type="button"
          onClick={() => onChange([...options, blankOption()])}
          className="ml-8 inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-medium text-fg-muted hover:border-fg-subtle hover:text-fg"
        >
          <Plus className="size-4" aria-hidden />
          Add option
        </button>
      ) : null}
    </fieldset>
  );
}

function Block({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function IconButton({ label, disabled, danger, onClick, children }: { label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors disabled:pointer-events-none disabled:opacity-35',
        danger ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-accent-soft hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
