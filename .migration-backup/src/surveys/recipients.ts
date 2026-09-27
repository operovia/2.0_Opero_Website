import { z } from 'zod';

export type ParsedRecipient = { name: string; email: string };

export type ParsedRecipients = {
  recipients: ParsedRecipient[];
  /** Lines with no usable email address, as typed. */
  invalid: string[];
  /** Addresses listed more than once in the pasted text. */
  duplicates: number;
};

export const MAX_RECIPIENTS_PER_PASTE = 1000;

const EMAIL = /[^\s<>(),;:"[\]]+@[^\s<>(),;:"'[\]]+\.[^\s<>(),;:"'[\]]+/;
const EMAILS = new RegExp(EMAIL.source, 'g');
const emailSchema = z.email();

const countEmails = (text: string) => text.match(EMAILS)?.length ?? 0;

function cleanName(text: string): string {
  return text
    .replace(/mailto:/gi, '')
    .replace(/[<>"()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:|'-]+|[\s,;:|'-]+$/g, '')
    .slice(0, 200);
}

/** Splits a line holding several people, trying the separators mail apps and spreadsheets use. */
function splitPeople(line: string, count: number): string[] {
  for (const separator of [';', '\t', ',']) {
    const parts = line.split(separator).filter((part) => EMAIL.test(part));
    if (parts.length === count && parts.every((part) => countEmails(part) === 1)) return parts;
  }
  return line.match(EMAILS) ?? [];
}

/**
 * Reads names and emails typed or pasted as lines, in the forms people
 * usually have them: "Jane Doe <jane@example.com>", "Jane Doe, jane@example.com",
 * a spreadsheet row with the name and email in separate columns, or just the
 * address. A line may hold several people separated by semicolons or commas,
 * as mail apps copy them.
 */
export function parseRecipients(text: string): ParsedRecipients {
  const recipients: ParsedRecipient[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const count = countEmails(line);
    const parts = count > 1 ? splitPeople(line, count) : [line];
    let usable = 0;
    for (const part of parts) {
      const match = part.match(EMAIL)?.[0];
      if (!match) continue;
      const email = match.replace(/^'+|['.]+$/g, '').toLowerCase();
      if (!emailSchema.safeParse(email).success) continue;
      usable++;
      if (seen.has(email)) {
        duplicates++;
        continue;
      }
      seen.add(email);
      recipients.push({ name: cleanName(part.replace(match, ' ')), email });
    }
    if (!usable) invalid.push(line.trim().slice(0, 200));
  }

  return { recipients, invalid, duplicates };
}
