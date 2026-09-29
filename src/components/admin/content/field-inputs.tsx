'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { Input, Select, Textarea } from '@/components/ui/field';
import type { ChoiceField, Field, ItemField, LinkField, ListField, TextField } from '@/content/fields';
import { cn } from '@/lib/cn';
import { emptyRichDoc, type RichDoc } from '@/lib/rich-text';
import { RichTextEditor } from './rich-text-editor';

export type Errors = Record<string, string>;

/** Destinations offered for button and link fields. */
const linkPresets = [
  { value: '#book-demo', label: 'Opens the demo request form' },
  { value: '/', label: 'Home page' },
  { value: '/partners', label: 'Partners page' },
  { value: '/privacy', label: 'Privacy page' },
];

/** A blank value for a new list item. */
export function emptyItem(fields: Record<string, ItemField>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [
      key,
      field.kind === 'rich' ? emptyRichDoc() : field.kind === 'choice' ? field.options[0]?.value ?? '' : '',
    ]),
  );
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
}

function TextInput({ id, field, value, onChange, error }: { id: string; field: TextField; value: string; onChange: (v: string) => void; error?: string }) {
  const hint = field.headline
    ? [field.hint, 'Press Enter to start a new line. Put words between asterisks, like *this*, to set them in italic teal.'].filter(Boolean).join(' ')
    : field.hint;
  const props = {
    id,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    maxLength: field.max,
    'aria-describedby': describedBy(id, hint, error),
    'aria-invalid': error ? (true as const) : undefined,
  };
  return (
    <FieldFrame id={id} label={field.label} hint={hint} error={error} optional={field.optional}>
      {field.multiline || field.headline ? <Textarea rows={field.multiline ? 3 : 2} {...props} /> : <Input {...props} />}
    </FieldFrame>
  );
}

function LinkInput({ id, field, value, onChange, error }: { id: string; field: LinkField; value: string; onChange: (v: string) => void; error?: string }) {
  const preset = linkPresets.some((p) => p.value === value) ? value : 'custom';
  return (
    <FieldFrame id={id} label={field.label} hint={field.hint} error={error} optional={field.optional}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Select
          id={id}
          value={preset}
          onChange={(e) => onChange(e.target.value === 'custom' ? '' : e.target.value)}
          aria-describedby={describedBy(id, field.hint, error)}
        >
          {linkPresets.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="custom">Another address</option>
        </Select>
        {preset === 'custom' ? (
          <Input
            aria-label={`${field.label} address`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://, mailto:, /path, or /#section"
            aria-invalid={error ? true : undefined}
          />
        ) : null}
      </div>
    </FieldFrame>
  );
}

function ChoiceInput({ id, field, value, onChange, error }: { id: string; field: ChoiceField; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <FieldFrame id={id} label={field.label} hint={field.hint} error={error}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy(id, field.hint, error)}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </FieldFrame>
  );
}

function RichInput({ id, field, value, onChange, error }: { id: string; field: ItemField; value: RichDoc; onChange: (v: RichDoc) => void; error?: string }) {
  return (
    <FieldFrame id={id} label={field.label} hint={field.hint} error={error} optional={field.optional}>
      <RichTextEditor value={value} onChange={onChange} labelId={`${id}-label`} describedBy={describedBy(id, field.hint, error)} invalid={Boolean(error)} />
    </FieldFrame>
  );
}

function ItemInput({ id, field, value, onChange, error }: { id: string; field: ItemField; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  switch (field.kind) {
    case 'text':
      return <TextInput id={id} field={field} value={String(value ?? '')} onChange={onChange} error={error} />;
    case 'link':
      return <LinkInput id={id} field={field} value={String(value ?? '')} onChange={onChange} error={error} />;
    case 'choice':
      return <ChoiceInput id={id} field={field} value={String(value ?? '')} onChange={onChange} error={error} />;
    case 'rich':
      return <RichInput id={id} field={field} value={(value as RichDoc) ?? emptyRichDoc()} onChange={onChange} error={error} />;
  }
}

function ListInput({
  name,
  field,
  value,
  onChange,
  errors,
}: {
  name: string;
  field: ListField;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  errors: Errors;
}) {
  const baseId = useId();
  const items = value ?? [];
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };
  const canAdd = field.max === undefined || items.length < field.max;
  const canRemove = items.length > (field.min ?? 0);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-fg">{field.label}</legend>
      {field.hint ? <p className="text-sm text-fg-muted">{field.hint}</p> : null}
      {errors[name] ? <p className="text-sm font-medium text-danger">{errors[name]}</p> : null}
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={String(item.__key ?? index)} className="rounded-lg border border-line bg-canvas-raised p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-fg">
                {field.itemLabel} {index + 1}
              </p>
              <div className="flex items-center gap-1">
                <IconButton label={`Move ${field.itemLabel.toLowerCase()} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label={`Move ${field.itemLabel.toLowerCase()} ${index + 1} down`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  label={`Remove ${field.itemLabel.toLowerCase()} ${index + 1}`}
                  disabled={!canRemove}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            </div>
            <div className={cn('grid grid-cols-1 gap-4', Object.keys(field.fields).length > 1 && 'sm:grid-cols-2')}>
              {Object.entries(field.fields).map(([key, itemField]) => (
                <div key={key} className={cn(itemField.kind === 'rich' || (itemField.kind === 'text' && itemField.multiline) ? 'sm:col-span-2' : '')}>
                  <ItemInput
                    id={`${baseId}-${index}-${key}`}
                    field={itemField}
                    value={item[key]}
                    onChange={(v) => onChange(items.map((it, i) => (i === index ? { ...it, [key]: v } : it)))}
                    error={errors[`${name}.${index}.${key}`] ?? errors[`${name}.${index}`]}
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {canAdd ? (
        <button
          type="button"
          onClick={() => onChange([...items, { ...emptyItem(field.fields), __key: crypto.randomUUID() }])}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-medium text-fg-muted hover:border-fg-subtle hover:text-fg"
        >
          <Plus className="size-4" aria-hidden />
          Add {field.itemLabel.toLowerCase()}
        </button>
      ) : null}
    </fieldset>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/** One field of a section, of any kind. */
export function FieldInput({ name, field, value, onChange, errors }: { name: string; field: Field; value: unknown; onChange: (v: unknown) => void; errors: Errors }) {
  const id = `content-${name}`;
  if (field.kind === 'list') {
    return <ListInput name={name} field={field} value={value as Record<string, unknown>[]} onChange={onChange} errors={errors} />;
  }
  return <ItemInput id={id} field={field} value={value} onChange={onChange} error={errors[name]} />;
}
