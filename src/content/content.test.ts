import { describe, expect, it } from 'vitest';
import { isSafeHref, richDocSchema, richToText, textToRich } from '@/lib/rich-text';
import { schemaFor, text, withSeed } from './fields';
import { plainHeadline } from '@/lib/headline';
import { defaultSettings } from '@/server/seed';
import { allSections, pages } from './registry';
import { contentTokens, fillTokens, fillTokensDeep, pluralize } from './tokens';

describe('seed content', () => {
  it.each(allSections().map((s) => [`${s.page}.${s.section}`, s] as const))('%s seed passes its own validation', (_name, { def }) => {
    const result = schemaFor(def.fields, def.check).safeParse(def.seed);
    expect(result.success, result.success ? '' : JSON.stringify(result.error.issues)).toBe(true);
  });

  // The website review's copy deck (October 2026), approved by the owner.
  it('keeps the approved hero copy word for word', () => {
    expect(plainHeadline(pages.home.sections.hero.seed.headline)).toBe('Integrated Intelligent Property Management');
    expect(pages.home.sections.hero.seed.points.map((p) => p.text)).toEqual([
      'One unified system to replace the patchwork of disconnected apps your teams run every day.',
      'Anchored by a purpose-built property management core CRM.',
      'Harnessed AI, built in from the ground up, with Oppie, your AI assistant.',
    ]);
    expect(defaultSettings.homeMetaTitle).toBe('Opero: Integrated Intelligent Property Management');
  });

  // "Real estate" reads as realtors, which Opero is not: the site says property management.
  it('says property management, never real estate', () => {
    const copy = JSON.stringify([allSections().map((s) => s.def.seed), defaultSettings]);
    expect(copy).not.toMatch(/real estate/i);
  });

  it('refuses slider bounds that disagree with each other', () => {
    const def = pages.investors.sections.round;
    const schema = schemaFor(def.fields, def.check);
    const parse = (changes: Partial<typeof def.seed>) => schema.safeParse({ ...def.seed, ...changes });
    expect(parse({}).success).toBe(true);
    const failing: [string, Partial<typeof def.seed>][] = [
      ['maximum', { maximum: 1_000_000 }],
      ['minimum', { minimum: 800_000 }],
      ['start', { start: 25_000 }],
      ['start', { start: 800_000 }],
      ['step', { step: 30_000 }],
    ];
    for (const [field, changes] of failing) {
      const result = parse(changes);
      expect(result.success, JSON.stringify(changes)).toBe(false);
      if (!result.success) expect(result.error.issues.map((i) => i.path[0])).toContain(field);
    }
  });

  it('lists modules in brand order', () => {
    expect(pages.home.sections.platform.seed.modules.map((m) => m.module)).toEqual(['build', 'studios', 'playbook', 'university', 'compass']);
  });
});

describe('content saved before a field existed', () => {
  const def = pages.home.sections.platform;
  const seed = def.seed as unknown as Record<string, unknown>;
  // The platform section as first published: no screenshot captions, no core panel, no Oppie note.
  const saved = {
    eyebrow: 'The platform.',
    headline: 'Our own headline',
    modules: [
      { module: 'studios', description: 'Boards.' },
      { module: 'build', description: 'Apps.' },
    ],
  };

  it('takes the seed for a missing field, and for a missing field in a list item from the item with the same choice', () => {
    const merged = withSeed(def.fields, seed, saved);
    expect(merged.headline).toBe('Our own headline');
    expect(merged.coreLabel).toBe(def.seed.coreLabel);
    const modules = merged.modules as { module: string; description: string; inside: string }[];
    expect(modules.map((m) => m.description)).toEqual(['Boards.', 'Apps.']);
    expect(modules[0]!.inside).toBe(def.seed.modules.find((m) => m.module === 'studios')!.inside);
    expect(modules[1]!.inside).toBe(def.seed.modules.find((m) => m.module === 'build')!.inside);
    expect(schemaFor(def.fields, def.check).safeParse(merged).success).toBe(true);
  });

  it('fails without it, which is what kept the editor from publishing', () => {
    expect(schemaFor(def.fields, def.check).safeParse({ ...seed, ...saved }).success).toBe(false);
  });

  it('keeps every saved value, empty ones included', () => {
    const merged = withSeed(def.fields, seed, { ...saved, modules: [{ module: 'compass', description: 'EOS.', inside: '' }] });
    // The empty caption stays empty; only the field the save predates (the recording link) comes from the seed.
    expect(merged.modules).toEqual([{ module: 'compass', description: 'EOS.', inside: '', video: '' }]);
  });

  it('matches by place in a list without a choice', () => {
    const fields = { stats: { kind: 'list', label: 'Stats', itemLabel: 'Stat', fields: { value: text('Value'), label: text('Label') } } } as const;
    const merged = withSeed(
      fields,
      {
        stats: [
          { value: '1', label: 'one' },
          { value: '2', label: 'two' },
        ],
      },
      { stats: [{ value: '9' }, { value: '8' }, { value: '7' }] },
    );
    expect(merged.stats).toEqual([{ value: '9', label: 'one' }, { value: '8', label: 'two' }, { value: '7' }]);
  });

  it('starts from the seed when nothing was saved', () => {
    expect(withSeed(def.fields, seed, null)).toEqual(seed);
  });
});

describe('headlines', () => {
  it('take line breaks and emphasis everywhere', () => {
    const headlines = allSections().flatMap(({ page, section, def }) =>
      Object.entries(def.fields)
        .filter(([, field]) => field.kind === 'text' && field.label === 'Headline')
        .map(([key, field]) => [`${page}.${section}.${key}`, field.kind === 'text' && field.headline === true]),
    );
    expect(headlines.length).toBeGreaterThan(10);
    expect(headlines.filter(([, breaks]) => !breaks)).toEqual([]);
  });

  it('keep one break between lines, without blank lines or stray spaces', () => {
    const schema = schemaFor({ headline: text('Headline', { headline: true }) });
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
    const bad = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }],
    };
    expect(richDocSchema.safeParse(bad).success).toBe(false);
    const extra = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '/partners', target: '_blank', class: 'x' } }] }] },
      ],
    };
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
