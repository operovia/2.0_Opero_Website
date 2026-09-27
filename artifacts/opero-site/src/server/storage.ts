import 'server-only';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { storageConfig, type StorageConfig } from '@/server/env';

/**
 * Where uploaded media lives. One small interface with two drivers: a local
 * folder for development, and any S3-compatible bucket (AWS S3, Cloudflare
 * R2, and others) for production. Chosen by environment variables.
 */
export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

/** Keys look like 2026/09/<uuid>.jpg; anything else is refused, so paths can never escape the store. */
export const MEDIA_KEY = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/;

function assertKey(key: string) {
  if (!MEDIA_KEY.test(key)) throw new Error(`Invalid media key: ${key}`);
}

function localStorage(directory: string): Storage {
  // Uploads are runtime data, not part of the build, so the bundler is told not to trace these paths.
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), directory);
  const file = (key: string) => {
    assertKey(key);
    return path.join(/*turbopackIgnore: true*/ root, key);
  };
  return {
    async put(key, body) {
      const target = file(key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    },
    async get(key) {
      try {
        return await readFile(file(key));
      } catch {
        return null;
      }
    },
    async remove(key) {
      await rm(file(key), { force: true });
    },
  };
}

function s3Storage(config: Extract<StorageConfig, { driver: 's3' }>): Storage {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return {
    async put(key, body, contentType) {
      assertKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    },
    async get(key) {
      assertKey(key);
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
        return result.Body ? Buffer.from(await result.Body.transformToByteArray()) : null;
      } catch (error) {
        if ((error as { name?: string }).name === 'NoSuchKey') return null;
        throw error;
      }
    },
    async remove(key) {
      assertKey(key);
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}

let storage: Storage | undefined;

export function getStorage(): Storage {
  if (!storage) {
    const config = storageConfig();
    storage = config.driver === 's3' ? s3Storage(config) : localStorage(config.directory);
  }
  return storage;
}
