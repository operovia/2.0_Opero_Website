import { describe, expect, it } from 'vitest';
import { isSafeHref, richDocSchema, richToText, textToRich } from '@/lib/rich-text';
import { schemaFor, text } from './fields';
import { withoutEmphasis } from '@/lib/headline';
import { defaultSettings } from '@/server/seed';
import { allSections, pages } from './registry';
import { contentTokens, fillTokens, fillTokensDeep, pluralize } from './tokens';

describe('seed content', () => {
  it.each(allSections().map((s) => [`${s.page}.${s.section}`, s] as const))('%s seed passes its own validation', (_name, { def }) => {
    const result = schemaFor(def.fields).safeParse(def.seed);
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  it('keeps the approved hero copy word for word', () => {
    expect(withoutEmphasis(pages.home.sections.hero.seed.headline)).toBe('The AI-driven operating platform for property management.');
    expect(pages.home.sections.hero.seed.headline).toMatch(/^\*The\* /);
    expect(richToText(pages.home.sections.hero.seed.subhead)).toBe(
      'One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step.',
    );
  });

  // "Real estate" reads as realtors, which Opero is not: the site says property management.
  it('says property management, never real estate', () => {
    const copy = JSON.stringify([allSections().map((s) => s.def.seed), defaultSettings]);
    expect(copy).not.toMatch(/real estate/i);
  });

  it('lists modules in brand order', () => {
    expect(pages.home.sections.platform.seed.modules.map((m) => m.module)).toEqual(['build', 'studios', 'playbook', 'university', 'compass']);
  });
});

describe('headlines', () => {
  it('take line breaks everywhere', () => {
    const headlines = allSections().flatMap(({ page, section, def }) =>
      Object.entries(def.fields)
        .filter(([, field]) => field.kind === 'text' && field.label === 'Headline')
        .map(([key, field]) => [`${page}.${section}.${key}`, field.kind === 'text' && field.lineBreaks === true]),
    );
    expect(headlines.length).toBeGreaterThan(10);
    expect(headlines.filter(([, breaks]) => !breaks)).toEqual([]);
  });

  it('keep one break between lines, without blank lines or stray spaces', () => {
    const schema = schemaFor({ headline: text('Headline', { lineBreaks: true }) });
    expect(schema.parse({ headline: ' I lived with the problem.  \r\n\r\n  Then I built the solution. ' }).headline).toBe(
      'I lived with the problem.\nThen I built the solution.',
    );
    expect(schema.safeParse({ headline: ' \n \n ' }).success).toBe(false);
  });
});

describe('rich text', () => {
  it('turns blank lines into paragraphs and single newlines into breaks', () => {
    const doc = textToRich('One\nTwo\n\nThree');
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0]!.content!.map((n) => n.type)).toEqual(['text', 'hardBreak', 'text']);
    expect(richToText(doc)).toBe('One\nTwo\n\nThree');
  });

  it('refuses unsafe links and strips unknown attributes', () => {
    const bad = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] };
    expect(richDocSchema.safeParse(bad).success).toBe(false);
    const extra = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '/partners', target: '_blank', class: 'x' } }] }] }] };
    const parsed = richDocSchema.parse(extra);
    expect(parsed.content[0]!.content![0]).toEqual({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '/partners' } }] });
  });

  it('rejects disallowed nodes', () => {
    const heading = { type: 'doc', content: [{ type: 'heading', content: [{ type: 'text', text: 'x' }] }] };
    expect(richDocSchema.safeParse(heading).success).toBe(false);
  });

  it.each([
    ['/partners', true],
    ['#book-demo', true],
    ['https://example.com/a', true],
    ['mailto:hello@operovia.com', true],
    ['tel:+17345550100', true],
    ['javascript:alert(1)', false],
    ['//evil.example', false],
    ['data:text/html,x', false],
    ['', false],
  ])('isSafeHref(%s) is %s', (href, expected) => {
    expect(isSafeHref(href)).toBe(expected);
  });
});

describe('content tokens', () => {
  const tokens = contentTokens({ partnerLabel: 'strategic customer', contactEmail: 'hello@operovia.com' });

  it('fills every form of the partner label and the contact email', () => {
    expect(fillTokens('Become a {partner}. {Partners} get more. Firms as {partners}. {Partner}! {email}', tokens)).toBe(
      'Become a strategic customer. Strategic customers get more. Firms as strategic customers. Strategic customer! hello@operovia.com',
    );
  });

  it('pluralizes common endings', () => {
    expect(pluralize('design partner')).toBe('design partners');
    expect(pluralize('early ally')).toBe('early allies');
    expect(pluralize('boss')).toBe('bosses');
  });

  it('fills tokens inside rich text and lists', () => {
    const filled = fillTokensDeep(pages.home.sections.partner.seed, contentTokens({ partnerLabel: 'design partner', contactEmail: 'x@y.z' }));
    expect(filled.headline).toBe('Become a design partner.');
    expect(richToText(filled.body)).toContain('as design partners: twelve months');
  });
});
