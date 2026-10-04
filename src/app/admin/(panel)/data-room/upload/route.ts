import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MAX_DOCUMENT_BYTES } from '@/lib/documents';
import { audit } from '@/server/audit';
import { getSession } from '@/server/auth/session';
import { storeDocument } from '@/server/data-room';
import { isSameOrigin } from '@/server/origin';
import { clientIp } from '@/server/request';

/* Room for the multipart wrapping around the file itself. */
const BODY_LIMIT = MAX_DOCUMENT_BYTES + 64 * 1024;
const TOO_LARGE = 'Documents can be up to 25 MB.';

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

/** Receives one document from the Data Room's upload control, into the folder named in the form (none for the top of the room). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Your session has ended. Sign in again.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Uploads must come from this site.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > BODY_LIMIT) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });

  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: TOO_LARGE }, { status: 413 });

  let file: FormDataEntryValue | null = null;
  let folder = '';
  try {
    const form = await new Response(body, { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData();
    file = form.get('file');
    folder = String(form.get('folder') ?? '');
  } catch {
    return NextResponse.json({ error: 'The upload could not be read. Try again.' }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a document to upload.' }, { status: 400 });
  const folderId = z.uuid().safeParse(folder).success ? folder : null;

  const result = await storeDocument(file, folderId, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  await audit({ id: session.user.id, email: session.user.email }, 'room.document.add', {
    target: result.title,
    details: { filename: result.filename, folder: folderId },
    ip: await clientIp(),
  });
  return NextResponse.json(result, { status: 201 });
}
