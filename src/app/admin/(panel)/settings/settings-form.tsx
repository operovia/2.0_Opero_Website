'use client';

import { useActionState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/forms';
import { saveSettings } from './actions';

export type SettingsFormValues = {
  siteName: string;
  contactEmail: string;
  notificationRecipients: string[];
  partnerProgramLabel: string;
  socialImageId: string | null;
  homeMetaTitle: string;
  homeMetaDescription: string;
  analyticsSnippet: string;
  maintenanceMode: boolean;
};

export function SettingsForm({ values, images }: { values: SettingsFormValues; images: { id: string; filename: string }[] }) {
  const [state, action] = useActionState(saveSettings, idleState);
  const e = state.fieldErrors ?? {};
  // After a submit, show what was submitted; before that, what is saved.
  const v = state.values ?? {
    siteName: values.siteName,
    contactEmail: values.contactEmail,
    notificationRecipients: values.notificationRecipients.join('\n'),
    partnerProgramLabel: values.partnerProgramLabel,
    socialImageId: values.socialImageId ?? '',
    homeMetaTitle: values.homeMetaTitle,
    homeMetaDescription: values.homeMetaDescription,
    analyticsSnippet: values.analyticsSnippet,
    maintenanceMode: values.maintenanceMode ? 'on' : '',
  };

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.message ? <Notice tone={state.status === 'error' ? 'danger' : 'success'}>{state.message}</Notice> : null}

      <Card>
        <CardHeader title="Site" description="Basics used across the public site and in emails." />
        <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field name="siteName" label="Site name" error={e.siteName} required>
            {(p) => <Input {...p} defaultValue={v.siteName} />}
          </Field>
          <Field name="contactEmail" label="Contact email" hint="Shown in the footer and used as the reply-to address." error={e.contactEmail} required>
            {(p) => <Input {...p} type="email" defaultValue={v.contactEmail} />}
          </Field>
          <Field
            name="partnerProgramLabel"
            label="Partner program label"
            hint="Written in lowercase, as it reads mid-sentence. Copy that uses {partner} or {partners} picks this up everywhere."
            error={e.partnerProgramLabel}
            required
            className="sm:col-span-2"
          >
            {(p) => <Input {...p} defaultValue={v.partnerProgramLabel} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" description="Who receives new demo requests and partner applications." />
        <CardBody>
          <Field
            name="notificationRecipients"
            label="Notification recipients"
            hint="One email address per line. If empty, notifications go to the contact email."
            error={e.notificationRecipients}
          >
            {(p) => <Textarea {...p} rows={4} defaultValue={v.notificationRecipients} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Search and sharing" description="How the home page appears in search results and when shared." />
        <CardBody className="space-y-6">
          <Field name="homeMetaTitle" label="Home page title" hint="Shown in browser tabs and search results. Aim for under 60 characters." error={e.homeMetaTitle} required>
            {(p) => <Input {...p} defaultValue={v.homeMetaTitle} />}
          </Field>
          <Field name="homeMetaDescription" label="Home page description" hint="Shown under the title in search results. Aim for under 160 characters." error={e.homeMetaDescription} required>
            {(p) => <Textarea {...p} rows={3} defaultValue={v.homeMetaDescription} />}
          </Field>
          <Field
            name="socialImageId"
            label="Default social share image"
            hint={images.length ? 'Shown when a page is shared on social media or in messages.' : 'Upload an image in Media to choose it here. Until then a generated image is used.'}
            error={e.socialImageId}
          >
            {(p) => (
              <Select {...p} defaultValue={v.socialImageId} disabled={!images.length}>
                <option value="">Generated default</option>
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.filename}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Analytics" description="Optional. Paste the snippet from your analytics provider." />
        <CardBody>
          <Field name="analyticsSnippet" label="Analytics snippet" hint="Added to every public page. Leave empty for no analytics." error={e.analyticsSnippet}>
            {(p) => <Textarea {...p} rows={5} spellCheck={false} className="font-mono text-sm" defaultValue={v.analyticsSnippet} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Maintenance" />
        <CardBody>
          <Switch
            name="maintenanceMode"
            defaultChecked={v.maintenanceMode === 'on'}
            label="Maintenance mode"
            description="Visitors see a holding page. The admin keeps working, and signed-in admins still see the real site."
          />
        </CardBody>
        <CardFooter>
          <SubmitButton pendingLabel="Saving">Save settings</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
