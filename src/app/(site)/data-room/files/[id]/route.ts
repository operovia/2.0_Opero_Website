import { documentKind } from '@/lib/documents';
import { dataRoomHidden } from '@/server/data-room-access';
import { getDocument, readDocument, recordDocumentEvent } from '@/server/data-room';
import { getAccess } from '@/server/entry';
import { getGuest } from '@/server/guests';
import { clientIp } from '@/server/request';

/**
 * Serves one Data Room document, to signed-in admins and to guests invited
 * as investors only; everyone else gets "not found", the same as for a
 * document that does not exist. PDFs and images open in the browser and the
 * rest download; ?download=1 downloads any of them. A guest's open or
 * download is recorded with their address. Nothing here is ever cached
 * outside the browser, and the file is served under the kind the room
 * accepted it as, never as a page.
 */
export async function GET(request: Request, { params }: RouteContext<'/data-room/files/[id]'>) {
  const [{ id }, access] = await Promise.all([params, getAccess()]);
  const document = await getDocument(id);
  if (!document || dataRoomHidden(access)) return new Response('Not found', { status: 404 });
  const body = await readDocument(document);
  if (!body) return new Response('Not found', { status: 404 });

  const download = new URL(request.url).searchParams.get('download') === '1';
  const inline = documentKind(document.filename).inline && !download;
  if (!access.admin) {
    const guest = await getGuest();
    if (guest) await recordDocumentEvent(document.id, inline ? 'open' : 'download', { inviteId: guest.inviteId, email: guest.email }, await clientIp());
  }

  // The file name for the download: plain ASCII for old clients, the real name beside it.
  const ascii = document.filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const disposition = `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(document.filename)}`;
  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': document.contentType,
      'Content-Length': String(body.length),
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
