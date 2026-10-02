/**
 * Environment access in one place. Every variable is documented in
 * .env.example. Nothing here is exposed to the browser.
 */

function trimmed(name: string): string {
  return (process.env[name] ?? '').trim();
}

/**
 * The public origin of the site, used for links in emails, sitemaps, and
 * metadata: SITE_URL, else the app's Replit address, else localhost. The
 * development server in Replit's workspace always uses its own address, the
 * dev URL. Replit keeps one list of Secrets for the workspace and the
 * published app, so SITE_URL (the public address) reaches the development
 * server too, and its links must lead back to it and its own database.
 */
export function siteUrl(): string {
  const devDomain = process.env.NODE_ENV === 'production' ? '' : trimmed('REPLIT_DEV_DOMAIN');
  if (devDomain) return `https://${devDomain}`;
  const explicit = trimmed('SITE_URL');
  if (explicit) return explicit.replace(/\/+$/, '');
  // Replit exposes its domains; any other host should set SITE_URL.
  const replitDomain = trimmed('REPLIT_DOMAINS').split(',')[0]?.trim();
  if (replitDomain) return `https://${replitDomain}`;
  return `http://localhost:${trimmed('PORT') || '3000'}`;
}

export const isProduction = process.env.NODE_ENV === 'production';

/** The first admin account, created on first run when no admin exists yet. */
export function adminSeed(): { email: string; password: string; name: string } | null {
  const email = trimmed('ADMIN_EMAIL').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!email || !password) return null;
  return { email, password, name: trimmed('ADMIN_NAME') };
}

export function emailConfig(): { apiKey: string; from: string; replyTo: string } {
  return {
    apiKey: trimmed('RESEND_API_KEY'),
    from: trimmed('EMAIL_FROM') || 'Opero <notifications@mail.operovia.com>',
    replyTo: trimmed('EMAIL_REPLY_TO'),
  };
}

export type StorageConfig =
  | { driver: 'local'; directory: string }
  | {
      driver: 's3';
      bucket: string;
      region: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
    };

export function storageConfig(): StorageConfig {
  const bucket = trimmed('S3_BUCKET');
  if (!bucket) return { driver: 'local', directory: trimmed('UPLOADS_DIR') || 'uploads' };
  return {
    driver: 's3',
    bucket,
    region: trimmed('S3_REGION') || 'auto',
    endpoint: trimmed('S3_ENDPOINT'),
    accessKeyId: trimmed('S3_ACCESS_KEY_ID'),
    secretAccessKey: trimmed('S3_SECRET_ACCESS_KEY'),
    forcePathStyle: trimmed('S3_FORCE_PATH_STYLE') === 'true',
  };
}
