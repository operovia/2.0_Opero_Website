'use client';

import { CircleCheck, X } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { requestDemo } from '@/app/(site)/inquiry-actions';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { DEMO_TARGET } from '@/content/constants';
import type { SectionData } from '@/content/registry';
import { idleState } from '@/lib/forms';
import { SpamTraps, stampElapsed } from './spam-traps';

type Content = SectionData<'site', 'demoForm'>;

/**
 * The demo request form, in a native modal dialog that opens from any link
 * to #book-demo on the page (and when a page is opened at /#book-demo).
 * The dialog traps focus, closes on Escape, and returns focus afterwards.
 */
export function DemoDialog({ content }: { content: Content }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.(`a[href="${DEMO_TARGET}"]`);
      if (!link) return;
      event.preventDefault();
      open();
    };
    document.addEventListener('click', onClick);
    if (window.location.hash === DEMO_TARGET) {
      open();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return () => document.removeEventListener('click', onClick);
  }, []);

  const onClose = () => {
    // After a successful request, start fresh next time; otherwise keep what was typed.
    if (dialog.current?.querySelector('[data-thank-you]')) setFormKey((k) => k + 1);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="demo-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="demo-dialog m-auto w-[calc(100%-2*var(--o-gutter))] max-w-xl rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay"
    >
      <div className="relative max-h-[calc(100dvh-2*var(--o-gutter))] overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg"
        >
          <X className="size-5" aria-hidden />
          <span className="sr-only">Close</span>
        </button>
        <DemoForm key={formKey} content={content} onDone={() => dialog.current?.close()} />
      </div>
    </dialog>
  );
}

function DemoForm({ content, onDone }: { content: Content; onDone: () => void }) {
  const [state, action] = useActionState(requestDemo, idleState);
  const thanks = useRef<HTMLHeadingElement>(null);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  // Move focus to the thank-you message so screen readers announce it.
  useEffect(() => {
    if (state.status === 'success') thanks.current?.focus();
  }, [state.status]);

  if (state.status === 'success') {
    return (
      <div data-thank-you className="py-6 text-center">
        <CircleCheck className="mx-auto size-10 text-success" aria-hidden />
        <h2 id="demo-title" ref={thanks} tabIndex={-1} className="mt-5 text-2xl font-semibold text-fg outline-none">
          {content.thankYouTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-fg-muted">{content.thankYouBody}</p>
        <button type="button" onClick={onDone} className="mt-8 h-11 rounded-full border border-line-strong px-6 text-sm font-semibold text-fg hover:bg-accent-soft">
          Close
        </button>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={(event) => stampElapsed(event.currentTarget)} noValidate className="space-y-5">
      <div className="pr-10">
        <h2 id="demo-title" className="text-2xl font-semibold text-fg">
          {content.title}
        </h2>
        <p className="mt-2 text-base text-fg-muted">{content.intro}</p>
      </div>
      {state.status === 'error' && state.message ? <Notice tone="danger">{state.message}</Notice> : null}
      <SpamTraps />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field name="demo-name" label={content.nameLabel} error={e.name} required>
          {(p) => <Input {...p} name="name" autoComplete="name" defaultValue={v.name ?? ''} />}
        </Field>
        <Field name="demo-firm" label={content.firmLabel} error={e.firm} required>
          {(p) => <Input {...p} name="firm" autoComplete="organization" defaultValue={v.firm ?? ''} />}
        </Field>
        <Field name="demo-email" label={content.emailLabel} error={e.email} required>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={v.email ?? ''} />}
        </Field>
        <Field name="demo-phone" label={content.phoneLabel} optionalLabel={content.optionalLabel} error={e.phone}>
          {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" defaultValue={v.phone ?? ''} />}
        </Field>
      </div>
      <Field name="demo-message" label={content.messageLabel} optionalLabel={content.optionalLabel} error={e.message}>
        {(p) => <Textarea {...p} name="message" rows={4} defaultValue={v.message ?? ''} />}
      </Field>
      <SubmitButton size="lg" className="w-full" pendingLabel={content.submitLabel}>
        {content.submitLabel}
      </SubmitButton>
    </form>
  );
}
