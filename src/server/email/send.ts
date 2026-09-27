import { Resend } from 'resend';
import { emailConfig, isProduction } from '@/server/env';
import type { RenderedEmail } from './layout';

export type OutgoingEmail = RenderedEmail & {
  to: string;
  subject: string;
  replyTo?: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

let client: Resend | undefined;
function resend(apiKey: string): Resend {
  client ??= new Resend(apiKey);
  return client;
}

function logInstead(email: OutgoingEmail): SendResult {
  const note = isProduction ? 'NOT SENT, RESEND_API_KEY is not set' : 'development, not sent';
  console.log(`\n[opero] Email (${note})\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
  return { ok: true, id: 'logged' };
}

/** Sends one email through Resend, or prints it to the server log when no API key is configured. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey) return logInstead(email);
  try {
    const { data, error } = await resend(apiKey).emails.send({
      from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo || replyTo || undefined,
    });
    if (error || !data) return { ok: false, error: error?.message ?? 'Unknown email error' };
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown email error' };
  }
}

/**
 * Sends many emails, in batches of up to 100 per request. Results line up
 * with the input order.
 */
export async function sendEmails(emails: OutgoingEmail[]): Promise<SendResult[]> {
  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey) return emails.map(logInstead);

  const results: SendResult[] = [];
  for (let start = 0; start < emails.length; start += 100) {
    const chunk = emails.slice(start, start + 100);
    try {
      const { data, error } = await resend(apiKey).batch.send(
        chunk.map((email) => ({
          from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          replyTo: email.replyTo || replyTo || undefined,
        })),
      );
      if (error || !data) {
        results.push(...chunk.map(() => ({ ok: false as const, error: error?.message ?? 'Unknown email error' })));
      } else {
        results.push(...chunk.map((_, i) => (data.data[i] ? { ok: true as const, id: data.data[i]!.id } : { ok: false as const, error: 'Not accepted' })));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      results.push(...chunk.map(() => ({ ok: false as const, error: message })));
    }
  }
  return results;
}
