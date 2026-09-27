'use client';

import { CircleCheck } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { applyForSeat } from '@/app/(site)/inquiry-actions';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import type { SectionData } from '@/content/registry';
import { idleState } from '@/lib/forms';
import { SpamTraps, stampElapsed } from './spam-traps';

/** The partner application. It stays on the page and thanks the applicant in place. */
export function PartnerApplicationForm({ content }: { content: SectionData<'partners', 'apply'> }) {
  const [state, action] = useActionState(applyForSeat, idleState);
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
        <Field name="apply-name" label={content.nameLabel} error={e.name} required>
          {(p) => <Input {...p} name="name" autoComplete="name" defaultValue={v.name ?? ''} />}
        </Field>
        <Field name="apply-firm" label={content.firmLabel} error={e.firm} required>
          {(p) => <Input {...p} name="firm" autoComplete="organization" defaultValue={v.firm ?? ''} />}
        </Field>
        <Field name="apply-role" label={content.roleLabel} error={e.role} required>
          {(p) => <Input {...p} name="role" autoComplete="organization-title" defaultValue={v.role ?? ''} />}
        </Field>
        <Field name="apply-email" label={content.emailLabel} error={e.email} required>
          {(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={v.email ?? ''} />}
        </Field>
        <Field name="apply-phone" label={content.phoneLabel} optionalLabel={optional} error={e.phone}>
          {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" defaultValue={v.phone ?? ''} />}
        </Field>
      </div>
      <fieldset className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <legend className="sr-only">Portfolio size</legend>
        <Field name="apply-commercialSqft" label={content.commercialLabel} optionalLabel={optional} error={e.commercialSqft}>
          {(p) => <Input {...p} name="commercialSqft" inputMode="numeric" defaultValue={v.commercialSqft ?? ''} />}
        </Field>
        <Field name="apply-residentialUnits" label={content.residentialLabel} optionalLabel={optional} error={e.residentialUnits}>
          {(p) => <Input {...p} name="residentialUnits" inputMode="numeric" defaultValue={v.residentialUnits ?? ''} />}
        </Field>
      </fieldset>
      <Field name="apply-systems" label={content.systemsLabel} hint={content.systemsHint || undefined} optionalLabel={optional} error={e.systems}>
        {(p) => <Textarea {...p} name="systems" rows={3} defaultValue={v.systems ?? ''} />}
      </Field>
      <Field name="apply-interest" label={content.interestLabel} error={e.interest} required>
        {(p) => <Textarea {...p} name="interest" rows={5} defaultValue={v.interest ?? ''} />}
      </Field>
      <SubmitButton size="lg" pendingLabel={content.submitLabel}>
        {content.submitLabel}
      </SubmitButton>
    </form>
  );
}
