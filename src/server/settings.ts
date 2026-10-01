import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteSettings } from '@/db/schema';
import { defaultSettings } from '@/server/seed';

export type SiteSettings = typeof siteSettings.$inferSelect;

/** The site settings row. Falls back to defaults if first-run seeding has not happened yet. */
export async function getSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return (
    row ?? {
      id: 1,
      ...defaultSettings,
      notificationRecipients: [],
      socialImageId: null,
      analyticsSnippet: '',
      maintenanceMode: false,
      privateSite: true,
      updatedBy: null,
      updatedAt: new Date(0),
    }
  );
}

/** Who should hear about new inquiries: the configured list, or the contact email. */
export function notificationRecipients(settings: SiteSettings): string[] {
  return settings.notificationRecipients.length ? settings.notificationRecipients : [settings.contactEmail];
}
