/**
 * Environment access in one place. Every variable is documented in
 * .env.example. Nothing here is exposed to the browser.
 */

function trimmed(name: string): string {
  return (process.env[name] ?? '').trim();
}

/** The public origin of the site, used for links in emails, sitemaps, and metadata. */
export function siteUrl(): string {
  const explicit = trimmed('SITE_URL');
  if (explicit) return explicit.replace(/\/+$/, '');
  // Replit exposes its domains; any other host should set SITE_URL.
  const replitDomain = trimmed('REPLIT_DOMAINS').split(',')[0]?.trim() || trimmed('REPLIT_DEV_DOMAIN');
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
  | { driver: 'gcs'; bucket: string }
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
  if (!bucket) {
    const appStorageBucket = trimmed('DEFAULT_OBJECT_STORAGE_BUCKET_ID');
    if (appStorageBucket) return { driver: 'gcs', bucket: appStorageBucket };
    if (isProduction) throw new Error('Persistent media storage is required in production. Configure App Storage or an S3 bucket.');
    return { driver: 'local', directory: trimmed('UPLOADS_DIR') || 'uploads' };
  }
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
