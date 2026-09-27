import { NextResponse } from 'next/server';
import { MAX_UPLOAD_BYTES } from '@/lib/media';
import { audit } from '@/server/audit';
import { getSession } from '@/server/auth/session';
import { storeUpload } from '@/server/media';
import { isSameOrigin } from '@/server/origin';
import { clientIp } from '@/server/request';

/* Room for the multipart wrapping around the file itself. */
const BODY_LIMIT = MAX_UPLOAD_BYTES + 64 * 1024;
const TOO_LARGE = 'Images can be up to 8 MB.';

/** Reads the request body, giving up as soon as it passes the limit, whatever the headers claim. */
async function readBody(request: Request): Promise<Uint8Array<ArrayBuffer> | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > BODY_LIMIT) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/** Receives one image from the media library's upload control. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Your session has ended. Sign in again.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Uploads must come from this site.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > BODY_LIMIT) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });

  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });

  let file: FormDataEntryValue | null = null;
  try {
    const form = await new Response(body, { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData();
    file = form.get('file');
  } catch {
    return NextResponse.json({ error: 'The upload could not be read. Try again.' }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });

  const result = await storeUpload(file, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  await audit({ id: session.user.id, email: session.user.email }, 'media.upload', { target: result.filename, details: { url: result.url }, ip: await clientIp() });
  return NextResponse.json(result, { status: 201 });
}
