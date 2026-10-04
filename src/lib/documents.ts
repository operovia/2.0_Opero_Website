/**
 * The Data Room's document rules, shared by the admin's upload control and
 * the server. A document is any file of a kind investors expect to find in a
 * data room; the kind is taken from the file's name alone, and the server
 * serves it under the type listed here, never the one the upload claimed.
 */

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const DOCUMENT_RULES = 'PDF, Word, Excel, PowerPoint, CSV, text, images, or ZIP, up to 25 MB each.';

export type DocumentKind = {
  /** The type the file is served under. */
  type: string;
  /** Shown on the document in the room. */
  label: string;
  /** Opens in the browser; everything else downloads. */
  inline: boolean;
};

/** Accepted file extensions, lowercase, with the kind each is served as. */
export const DOCUMENT_KINDS: Record<string, DocumentKind> = {
  pdf: { type: 'application/pdf', label: 'PDF', inline: true },
  doc: { type: 'application/msword', label: 'Word', inline: false },
  docx: { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word', inline: false },
  xls: { type: 'application/vnd.ms-excel', label: 'Excel', inline: false },
  xlsx: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel', inline: false },
  ppt: { type: 'application/vnd.ms-powerpoint', label: 'PowerPoint', inline: false },
  pptx: { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint', inline: false },
  csv: { type: 'text/csv', label: 'CSV', inline: false },
  txt: { type: 'text/plain', label: 'Text', inline: false },
  png: { type: 'image/png', label: 'Image', inline: true },
  jpg: { type: 'image/jpeg', label: 'Image', inline: true },
  webp: { type: 'image/webp', label: 'Image', inline: true },
  gif: { type: 'image/gif', label: 'Image', inline: true },
  zip: { type: 'application/zip', label: 'ZIP', inline: false },
};

/** What the file picker offers: the accepted extensions. */
export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_KINDS)
  .map((ext) => `.${ext}`)
  .join(',');

/** The accepted extension a file name ends in (jpeg counts as jpg), or null for a file the room does not take. */
export function documentExtension(filename: string): string | null {
  const match = /\.([A-Za-z0-9]+)$/.exec(filename.trim());
  if (!match) return null;
  const ext = match[1]!.toLowerCase();
  const normalized = ext === 'jpeg' ? 'jpg' : ext;
  return normalized in DOCUMENT_KINDS ? normalized : null;
}

/** The kind a stored document is, from its file name. */
export function documentKind(filename: string): DocumentKind {
  const ext = documentExtension(filename);
  return (ext && DOCUMENT_KINDS[ext]) || { type: 'application/octet-stream', label: 'File', inline: false };
}

/** A document's title as the room first shows it: the file's name without its extension and with the dashes and underscores people type into file names turned to spaces. */
export function titleFromFilename(filename: string): string {
  return (
    filename
      .replace(/\.[A-Za-z0-9]+$/, '')
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160) || 'Document'
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
