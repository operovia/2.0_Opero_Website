import { describe, expect, it } from 'vitest';
import { investorHubHidden, linksToFounder, linksToInvestorHub, visibleLinks, withVisibleLinks } from './investor-hub';

const site = 'https://opero.example';

const founder = { label: 'Founder', href: '/founder' };
const hub = { label: 'Investor Hub', href: '/investors' };
const partners = { label: 'Design partners', href: '/partners' };
const absoluteFounder = { label: 'Founder', href: 'https://opero.example/founder/' };
const absoluteHub = { label: 'Investor Hub', href: 'https://opero.example/investors?from=nav' };

describe('Investor Hub visibility', () => {
  it('is hidden from visitors', () => {
    expect(investorHubHidden(false)).toBe(true);
  });

  it('shows to anyone with a key: a guest or a signed-in admin', () => {
    const guest = { inviteId: 'i', email: 'g@example.com', sessionId: 's' };
    const session = { sessionId: 's', user: { id: 'u', email: 'a@example.com', name: 'A' } };
    expect(investorHubHidden(null !== null || guest !== null)).toBe(false);
    expect(investorHubHidden(session !== null || null !== null)).toBe(false);
    expect(investorHubHidden(session !== null || guest !== null)).toBe(false);
  });

  it.each(['/investors', '/investors/', '/investors#talk', '/investors?from=nav', 'https://opero.example/investors'])('recognizes the hub at %j', (href) => {
    expect(linksToInvestorHub(href, site)).toBe(true);
    expect(linksToFounder(href, site)).toBe(false);
  });

  it.each(['/founder', '/founder/', '/founder#story', '/founder?from=nav', 'https://opero.example/founder'])('recognizes the Founder page at %j', (href) => {
    expect(linksToFounder(href, site)).toBe(true);
    expect(linksToInvestorHub(href, site)).toBe(false);
  });

  it.each([
    '/partners',
    '/#platform',
    '#book-demo',
    '/investors-old',
    '/founders',
    'https://elsewhere.example/investors',
    'https://elsewhere.example/founder',
    'mailto:hello@operovia.com',
    'not a url at all ://',
  ])('leaves %j alone', (href) => {
    expect(linksToInvestorHub(href, site)).toBe(false);
    expect(linksToFounder(href, site)).toBe(false);
  });

  it('shows the Founder tab and hides the hub tab while the hub is hidden', () => {
    expect(visibleLinks([partners, founder, hub], true, site)).toEqual([partners, founder]);
  });

  it('shows the hub tab and hides the Founder tab while the hub is shown', () => {
    expect(visibleLinks([partners, founder, hub], false, site)).toEqual([partners, hub]);
  });

  it('filters absolute and relative links to either page the same way', () => {
    const links = [partners, absoluteFounder, absoluteHub, founder, hub];
    expect(visibleLinks(links, true, site)).toEqual([partners, absoluteFounder, founder]);
    expect(visibleLinks(links, false, site)).toEqual([partners, absoluteHub, hub]);
  });

  it('never shows both tabs at once, and keeps a list with neither as it is', () => {
    for (const hidden of [true, false]) {
      const shown = visibleLinks([founder, hub], hidden, site);
      expect(shown).toHaveLength(1);
      expect(visibleLinks([partners], hidden, site)).toEqual([partners]);
    }
  });

  it('filters a header or footer section, leaving its other fields alone', () => {
    const header = { links: [founder, hub], buttonLabel: 'Book a demo' };
    expect(withVisibleLinks(header, true, site)).toEqual({ links: [founder], buttonLabel: 'Book a demo' });
    expect(withVisibleLinks(header, false, site)).toEqual({ links: [hub], buttonLabel: 'Book a demo' });
  });
});
