import { tokens } from '@/theme/tokens';
import { escapeHtml, safeUrl } from './escape';

/**
 * The one branded layout every outbound email uses. Email clients ignore
 * CSS variables and most stylesheets, so values come straight from the
 * light theme tokens and are inlined.
 */

export type EmailContent = {
  /** Short summary shown in inbox previews. */
  preheader: string;
  heading: string;
  /** Paragraphs of plain text. Line breaks inside a paragraph are kept. */
  body: string[];
  /** Label and value rows, e.g. the fields of a form submission. */
  details?: [label: string, value: string][];
  button?: { label: string; url: string };
  /** Small print under the card. */
  footnote?: string;
};

export type RenderedEmail = { html: string; text: string };

const c = tokens.color.light;
const font = `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const company = 'Operovia, Inc. · Ann Arbor, Michigan';

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-family:${font};font-size:16px;line-height:1.65;color:${c.fgMuted};">${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;

function detailsTable(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value]) => `<tr>
<td style="padding:10px 12px 10px 0;border-top:1px solid ${c.line};font-family:${font};font-size:13px;line-height:1.5;color:${c.fgSubtle};vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
<td style="padding:10px 0;border-top:1px solid ${c.line};font-family:${font};font-size:15px;line-height:1.55;color:${c.fg};vertical-align:top;">${escapeHtml(value || 'Not provided').replace(/\n/g, '<br>')}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-collapse:collapse;">${cells}</table>`;
}

function buttonBlock({ label, url }: { label: string; url: string }): string {
  const href = escapeHtml(safeUrl(url));
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr>
<td style="border-radius:999px;background:${c.accent};"><a href="${href}" style="display:inline-block;padding:14px 28px;border-radius:999px;font-family:${font};font-size:15px;font-weight:600;line-height:1;color:${c.onAccent};text-decoration:none;">${escapeHtml(label)}</a></td>
</tr></table>
<p style="margin:0 0 8px;font-family:${font};font-size:13px;line-height:1.6;color:${c.fgSubtle};">If the button does not work, paste this link into your browser:<br><a href="${href}" style="color:${c.fgMuted};word-break:break-all;">${escapeHtml(safeUrl(url))}</a></p>`;
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${c.canvasRaised};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.canvasRaised};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 24px;font-family:${font};font-size:22px;font-weight:700;color:${c.fg};">Opero</td></tr>
<tr><td style="background:${c.surface};border:1px solid ${c.line};border-radius:16px;padding:32px 28px 20px;">
<h1 style="margin:0 0 16px;font-family:${font};font-size:22px;font-weight:600;line-height:1.35;color:${c.fg};">${escapeHtml(content.heading)}</h1>
${content.body.map(paragraph).join('\n')}
${content.details?.length ? detailsTable(content.details) : ''}
${content.button ? buttonBlock(content.button) : ''}
</td></tr>
<tr><td style="padding:20px 4px;font-family:${font};font-size:13px;line-height:1.6;color:${c.fgSubtle};">${content.footnote ? `${escapeHtml(content.footnote)}<br>` : ''}${escapeHtml(company)}</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    content.heading,
    '',
    ...content.body.flatMap((p) => [p, '']),
    ...(content.details ?? []).map(([label, value]) => `${label}: ${value || 'Not provided'}`),
    ...(content.details?.length ? [''] : []),
    ...(content.button ? [`${content.button.label}: ${safeUrl(content.button.url)}`, ''] : []),
    ...(content.footnote ? [content.footnote] : []),
    company,
  ].join('\n');

  return { html, text };
}
