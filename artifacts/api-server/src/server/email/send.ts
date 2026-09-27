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
  console.log(`\n[opero] Email (development, not sent)\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
  return { ok: true, id: 'logged' };
}

/** Sends one email through Resend, or prints it to the server log when no API key is configured. */
export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey) return isProduction
    ? { ok: false, error: 'Email delivery is not configured. Set RESEND_API_KEY.' }
    : logInstead(email);
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

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends many emails, in batches of up to 100 per request. Results line up
 * with the input order. Resend allows only a few requests a second, so
 * batches are spaced out and retried when the limit is hit.
 */
export async function sendEmails(emails: OutgoingEmail[]): Promise<SendResult[]> {
  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey) return isProduction
    ? emails.map(() => ({ ok: false as const, error: 'Email delivery is not configured. Set RESEND_API_KEY.' }))
    : emails.map(logInstead);

  const results: SendResult[] = [];
  for (let start = 0; start < emails.length; start += 100) {
    const chunk = emails.slice(start, start + 100);
    if (start > 0) await pause(600);
    try {
      const payload = chunk.map((email) => ({
        from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo || replyTo || undefined,
      }));
      let { data, error } = await resend(apiKey).batch.send(payload);
      for (let attempt = 1; error?.name === 'rate_limit_exceeded' && attempt <= 3; attempt++) {
        await pause(1000 * 2 ** (attempt - 1));
        ({ data, error } = await resend(apiKey).batch.send(payload));
      }
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
