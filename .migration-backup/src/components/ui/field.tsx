import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const control =
  'block w-full rounded-md border border-line-input bg-surface px-3.5 text-base text-fg shadow-sm transition-[border-color,box-shadow] duration-150 placeholder:text-fg-subtle hover:border-fg-subtle focus-visible:border-focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40 disabled:opacity-60 aria-invalid:border-danger';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(control, 'py-2.5', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <span className={cn('relative block', className)}>
      <select className={cn(control, 'h-11 appearance-none pr-10')} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-fg-muted" />
    </span>
  );
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('block text-sm font-medium text-fg', className)} {...props} />;
}

type FieldProps = {
  /** Used for the control's id and name. */
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Shown next to the label for optional fields. */
  optionalLabel?: string;
  className?: string;
  children: (control: { id: string; name: string; 'aria-describedby'?: string; 'aria-invalid'?: true; required?: boolean }) => ReactNode;
};

/**
 * Label, control, hint, and error wired together for assistive tech. The
 * control is rendered by the children function with the right ids.
 */
export function Field({ name, label, hint, error, required, optionalLabel, className, children }: FieldProps) {
  const id = `field-${name}`;
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {!required && optionalLabel ? <span className="ml-1.5 font-normal text-fg-subtle">{optionalLabel}</span> : null}
      </Label>
      {children({ id, name, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
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

type SwitchProps = Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode; description?: ReactNode };

/** A checkbox presented as an on/off switch. Submits "on" when checked. */
export function Switch({ label, description, className, id, name, ...props }: SwitchProps) {
  const inputId = id ?? `switch-${name}`;
  return (
    <label htmlFor={inputId} className={cn('flex cursor-pointer items-start gap-3', className)}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={inputId} name={name} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-6 w-11 rounded-full border border-line-input bg-surface-raised transition-colors duration-150 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas peer-disabled:opacity-50" />
        <span className="absolute left-1 top-1 size-4 rounded-full bg-fg-muted transition-transform duration-150 peer-checked:translate-x-5 peer-checked:bg-on-accent" />
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description ? <span className="block text-sm text-fg-muted">{description}</span> : null}
      </span>
    </label>
  );
}

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode };

export function Checkbox({ label, className, id, name, ...props }: CheckboxProps) {
  const inputId = id ?? `checkbox-${name}`;
  return (
    <label htmlFor={inputId} className={cn('flex cursor-pointer items-center gap-3 text-sm text-fg', className)}>
      <input
        id={inputId}
        name={name}
        type="checkbox"
        className="size-4 shrink-0 rounded-xs border-line-input accent-[var(--o-accent)]"
        {...props}
      />
      {label}
    </label>
  );
}
