'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { RichTextEditor } from '@/components/admin/content/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Input, Switch } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import type { RichDoc } from '@/lib/rich-text';
import { saveSurveySettingsAction, type ActionResult } from '../../actions';

type Values = { title: string; slug: string; intro: RichDoc; thankYou: RichDoc; anonymous: boolean; openLinkEnabled: boolean };

type Props = { surveyId: string; base: string; values: Values; slugLocked: boolean; anonymityLocked: boolean };

export function SurveySettingsForm({ surveyId, base, values: initial, slugLocked, anonymityLocked }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const unsaved = JSON.stringify(values) !== saved;
  const set = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }));

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const submit = () => {
    setResult(null);
    startTransition(async () => {
      const r = await saveSurveySettingsAction(surveyId, values);
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok) setSaved(JSON.stringify(values));
      router.refresh();
    });
  };

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}

      <Card>
        <CardHeader title="Survey" description="What respondents see." />
        <CardBody className="space-y-6">
          <Block id="survey-title" label="Title" error={errors.title}>
            <Input id="survey-title" value={values.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} aria-invalid={errors.title ? true : undefined} />
          </Block>
          <Block
            id="survey-slug"
            label="Web address"
            error={errors.slug}
            hint={
              slugLocked
                ? 'Fixed now that invitations have gone out or responses have arrived, so links people have keep working.'
                : `The survey is at ${base}${values.slug || 'your-survey'}.`
            }
          >
            <Input
              id="survey-slug"
              value={values.slug}
              onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              maxLength={60}
              spellCheck={false}
              autoCapitalize="none"
              disabled={slugLocked}
              aria-invalid={errors.slug ? true : undefined}
            />
          </Block>
          <Block id="survey-intro" label="Introduction" optional hint="Shown above the questions." error={errors.intro}>
            <RichTextEditor value={values.intro} onChange={(intro) => set({ intro })} labelId="survey-intro-label" invalid={Boolean(errors.intro)} />
          </Block>
          <Block id="survey-thanks" label="Thank-you message" hint="Shown after someone submits the survey." error={errors.thankYou}>
            <RichTextEditor value={values.thankYou} onChange={(thankYou) => set({ thankYou })} labelId="survey-thanks-label" invalid={Boolean(errors.thankYou)} />
          </Block>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Responses" description="Who can respond, and what you see about them." />
        <CardBody className="space-y-6">
          <div className="space-y-2">
            <Switch
              id="survey-anonymous"
              label="Anonymous"
              description={
                anonymityLocked
                  ? 'Cannot change once responses have arrived.'
                  : 'Answers are not linked to the people who gave them. You still see who has finished, but not what each person said. Response times are kept to the day.'
              }
              checked={values.anonymous}
              onChange={(e) => set({ anonymous: e.target.checked })}
              disabled={anonymityLocked}
            />
            {errors.anonymous ? <p className="text-sm font-medium text-danger">{errors.anonymous}</p> : null}
          </div>
          <Switch
            id="survey-open-link"
            label="Open link"
            description={`Anyone with ${base}${values.slug} can respond without a personal invitation. Their responses are marked as coming from the open link, and repeat responses from the same browser are refused.`}
            checked={values.openLinkEnabled}
            onChange={(e) => set({ openLinkEnabled: e.target.checked })}
          />
        </CardBody>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-5 py-4 shadow-md backdrop-blur">
        {unsaved ? <Badge tone="warning">Unsaved changes</Badge> : <Badge tone="success">Saved</Badge>}
        <Button type="submit" disabled={pending || !unsaved} aria-busy={pending || undefined}>
          {pending ? 'Saving' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}

function Block({ id, label, optional, hint, error, children }: { id: string; label: string; optional?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="text-sm text-fg-muted">{hint}</p> : null}
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}
