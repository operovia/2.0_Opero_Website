'use client';

import { CircleCheck } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { sendInvestorInquiry } from '@/app/(site)/inquiry-actions';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import type { SectionData } from '@/content/registry';
import { idleState } from '@/lib/forms';
import { SpamTraps, stampElapsed } from './spam-traps';

/** The Data Room overview's contact form. It stays on the page and thanks the sender in place. */
export function InvestorInquiryForm({ content }: { content: SectionData<'investors', 'contact'> }) {
  const [state, action] = useActionState(sendInvestorInquiry, idleState);
  const thanks = useRef<HTMLHeadingElement>(null);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  useEffect(() => {
    if (state.status === 'success') thanks.current?.focus();
  }, [state.status]);

  if (state.status === 'success') {
    return (
      <div className="py-10 text-center">
        <CircleCheck className="mx-auto size-10 text-success" aria-hidden />
        <h3 ref={thanks} tabIndex={-1} className="mt-5 text-2xl font-semibold text-fg outline-none">
          {content.thankYouTitle}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-lg text-fg-muted">{content.thankYouBody}</p>
      </div>
    );
  }

  const optional = content.optionalLabel;
  return (
    <form action={action} onSubmit={(event) => stampElapsed(event.currentTarget)} noValidate className="space-y-6">
      {state.status === 'error' && state.message ? <Notice tone="danger">{state.message}</Notice> : null}
      <SpamTraps />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field name="investor-name" label={content.nameLabel} error={e.name} required>
          {(p) => <Input {...p} name="name" autoComplete="name" defaultValue={v.name ?? ''} />}
        </Field>
        <Field name="investor-firm" label={content.firmLabel} optionalLabel={optional} error={e.firm}>
          {(p) => <Input {...p} name="firm" autoComplete="organization" defaultValue={v.firm ?? ''} />}
        </Field>
        <Field name="investor-email" label={content.emailLabel} error={e.email} required>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={v.email ?? ''} />}
        </Field>
        <Field name="investor-phone" label={content.phoneLabel} optionalLabel={optional} error={e.phone}>
          {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" defaultValue={v.phone ?? ''} />}
        </Field>
      </div>
      <Field name="investor-message" label={content.messageLabel} optionalLabel={optional} error={e.message}>
        {(p) => <Textarea {...p} name="message" rows={5} defaultValue={v.message ?? ''} />}
      </Field>
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel={content.submitLabel}>
        {content.submitLabel}
      </SubmitButton>
    </form>
  );
}
