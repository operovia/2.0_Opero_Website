import 'server-only';
import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import sharp, { type Metadata } from 'sharp';
import { getPageDef, getSectionDef } from '@/content/registry';
import { db } from '@/db/client';
import { adminUsers, contentSections, media } from '@/db/schema';
import { MAX_UPLOAD_BYTES } from '@/lib/media';
import { changeContent } from '@/server/content-version';
import { getSettings } from '@/server/settings';
import { getStorage } from '@/server/storage';

const formats = {
  jpeg: { ext: 'jpg', type: 'image/jpeg' },
  png: { ext: 'png', type: 'image/png' },
  webp: { ext: 'webp', type: 'image/webp' },
  gif: { ext: 'gif', type: 'image/gif' },
  heif: { ext: 'avif', type: 'image/avif' },
} as const;

export const contentTypeFor = (key: string): string =>
  Object.values(formats).find((f) => key.endsWith(`.${f.ext}`))?.type ?? 'application/octet-stream';

export const mediaUrl = (key: string) => `/media/${key}`;

export type UploadResult = { ok: true; id: string; url: string; filename: string } | { ok: false; error: string };

/**
 * Stores an uploaded image. The file is decoded to confirm it really is a
 * supported image, whatever its name or declared type says. Still images are
 * re-saved upright and without hidden metadata such as GPS location.
 * SVG is not accepted, since it can carry scripts.
 */
export async function storeUpload(file: File, userId: string): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: 'That file is empty.' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'Images can be up to 8 MB.' };

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input, { animated: true }).metadata();
  } catch {
    return { ok: false, error: 'That file is not an image we can use. Upload a JPEG, PNG, WebP, GIF, or AVIF.' };
  }
  // HEIF files are only accepted when they are AVIF; iPhone HEIC photos are not shown by most browsers.
  const format = meta.format === 'heif' && meta.compression !== 'av1' ? undefined : formats[meta.format as keyof typeof formats];
  if (!format) return { ok: false, error: 'Upload a JPEG, PNG, WebP, GIF, or AVIF image. Photos in HEIC format need to be exported as JPEG first.' };
  const frameHeight = meta.pageHeight ?? meta.height ?? 0;
  if ((meta.width ?? 0) * frameHeight > 60_000_000) return { ok: false, error: 'That image has too many pixels. Resize it and try again.' };

  let body = input;
  let width = meta.width ?? null;
  let height = frameHeight || null;
  // Animations are kept exactly as uploaded; re-encoding them would drop frames.
  if ((meta.pages ?? 1) === 1) {
    const image = sharp(input).rotate();
    const out =
      format.ext === 'jpg'
        ? image.jpeg({ quality: 90, mozjpeg: true })
        : format.ext === 'png'
          ? image.png()
          : format.ext === 'webp'
            ? image.webp({ quality: 90 })
            : format.ext === 'gif'
              ? image.gif()
              : image.avif({ quality: 70 });
    const { data, info } = await out.toBuffer({ resolveWithObject: true });
    body = data;
    width = info.width;
    height = info.height;
  }

  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${format.ext}`;
  const storage = getStorage();
  await storage.put(key, body, format.type);

  const filename = (file.name || `image.${format.ext}`).replace(/[^\w.\- ()]+/g, '_').slice(0, 180);
  try {
    const [row] = await db
      .insert(media)
      .values({ storageKey: key, filename, contentType: format.type, size: body.length, width, height, uploadedBy: userId })
      .returning({ id: media.id });
    return { ok: true, id: row!.id, url: mediaUrl(key), filename };
  } catch (error) {
    await storage.remove(key).catch(() => {});
    throw error;
  }
}

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
  uploadedBy: string | null;
  /** Where the image is used: the social share image, or links in content sections. */
  usedIn: string[];
};

/** Every uploaded image, newest first, with where each one is used. */
export async function listMedia(): Promise<MediaItem[]> {
  const [rows, settings, sections] = await Promise.all([
    db
      .select({
        id: media.id,
        storageKey: media.storageKey,
        filename: media.filename,
        contentType: media.contentType,
        size: media.size,
        width: media.width,
        height: media.height,
        createdAt: media.createdAt,
        uploaderName: adminUsers.name,
        uploaderEmail: adminUsers.email,
      })
      .from(media)
      .leftJoin(adminUsers, eq(media.uploadedBy, adminUsers.id))
      .orderBy(desc(media.createdAt)),
    getSettings(),
    db.select({ page: contentSections.page, section: contentSections.section, draft: contentSections.draft, published: contentSections.published }).from(contentSections),
  ]);

  const sectionText = sections.map((s) => ({
    label: `${getPageDef(s.page)?.label ?? s.page}: ${getSectionDef(s.page, s.section)?.label ?? s.section}`,
    text: JSON.stringify(s.draft) + JSON.stringify(s.published),
  }));

  return rows.map((row) => ({
    id: row.id,
    url: mediaUrl(row.storageKey),
    filename: row.filename,
    contentType: row.contentType,
    size: row.size,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt,
    uploadedBy: row.uploaderName || row.uploaderEmail || null,
    usedIn: [
      ...(settings.socialImageId === row.id ? ['Social share image'] : []),
      ...sectionText.filter((s) => s.text.includes(mediaUrl(row.storageKey))).map((s) => s.label),
    ],
  }));
}

/**
 * Deletes an image from the library and from storage. If it was the social
 * share image, the setting is cleared and the public site refreshed.
 */
export async function removeMedia(id: string): Promise<{ filename: string } | null> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) return null;
  const settings = await getSettings();
  // The settings row lets go of the image by itself (on delete set null).
  if (settings.socialImageId === id) await changeContent((tx) => tx.delete(media).where(eq(media.id, id)));
  else await db.delete(media).where(eq(media.id, id));
  try {
    await getStorage().remove(row.storageKey);
  } catch (error) {
    console.error('[opero] Could not remove a deleted image from storage', row.storageKey, error);
  }
  return { filename: row.filename };
}
