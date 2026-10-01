import { desc, like } from 'drizzle-orm';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { db } from '@/db/client';
import { media } from '@/db/schema';
import { requireAdmin } from '@/server/auth/session';
import { getSettings } from '@/server/settings';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const images = await db
    .select({ id: media.id, filename: media.filename })
    .from(media)
    .where(like(media.contentType, 'image/%'))
    .orderBy(desc(media.createdAt));

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Site-wide details, notifications, search appearance, and maintenance mode." />
      <SettingsForm
        images={images}
        values={{
          siteName: settings.siteName,
          contactEmail: settings.contactEmail,
          notificationRecipients: settings.notificationRecipients,
          partnerProgramLabel: settings.partnerProgramLabel,
          socialImageId: settings.socialImageId,
          homeMetaTitle: settings.homeMetaTitle,
          homeMetaDescription: settings.homeMetaDescription,
          analyticsSnippet: settings.analyticsSnippet,
          maintenanceMode: settings.maintenanceMode,
          privateSite: settings.privateSite,
        }}
      />
      <Card>
        <CardHeader
          title="Guests"
          description="The guest list says who may come in through the front door and what they see: a visitor the site, an investor the site and the Investor Hub. You see everything while signed in."
        />
        <CardBody>
          <ButtonLink href="/admin/guests" variant="secondary" size="sm">
            Manage the guest list
          </ButtonLink>
        </CardBody>
      </Card>
    </div>
  );
}
