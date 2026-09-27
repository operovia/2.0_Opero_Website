import { contentTypeFor } from '@/server/media';
import { getStorage, MEDIA_KEY } from '@/server/storage';

/**
 * Serves uploaded media at a stable address (/media/2026/09/<id>.jpg),
 * whichever storage is behind it. Keys never change, so responses are
 * cached for a year.
 */
export async function GET(_request: Request, { params }: RouteContext<'/media/[...key]'>) {
  const key = (await params).key.join('/');
  if (!MEDIA_KEY.test(key)) return new Response('Not found', { status: 404 });
  const body = await getStorage().get(key);
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': contentTypeFor(key),
      'Content-Length': String(body.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
