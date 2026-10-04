import { describe, expect, it } from 'vitest';
import { dataRoomHidden, linksToFounder, linksToDataRoom, siteClosed, visibleLinks, withVisibleLinks } from './data-room-access';

const site = 'https://opero.example';

const founder = { label: 'Founder', href: '/founder' };
const hub = { label: 'Data Room', href: '/data-room' };
const oldHub = { label: 'Investor Hub', href: '/investors' };
const files = { label: 'Documents', href: '/data-room/files' };
const partners = { label: 'Design partners', href: '/partners' };
const absoluteFounder = { label: 'Founder', href: 'https://opero.example/founder/' };
const absoluteHub = { label: 'Investor Hub', href: 'https://opero.example/investors?from=nav' };

const nobody = { admin: false, role: null } as const;
const visitor = { admin: false, role: 'visitor' } as const;
const investor = { admin: false, role: 'investor' } as const;
const admin = { admin: true, role: null } as const;

describe('Data Room visibility', () => {
  it('is hidden from people without a key and from guests invited as visitors', () => {
    expect(dataRoomHidden(nobody)).toBe(true);
    expect(dataRoomHidden(visitor)).toBe(true);
  });

  it('shows to guests invited as investors and to signed-in admins', () => {
    expect(dataRoomHidden(investor)).toBe(false);
    expect(dataRoomHidden(admin)).toBe(false);
    expect(dataRoomHidden({ admin: true, role: 'visitor' })).toBe(false);
  });

  it('is hidden from an admin viewing the site as a visitor', () => {
    expect(dataRoomHidden({ ...admin, asVisitor: true })).toBe(true);
    expect(dataRoomHidden({ ...admin, asVisitor: false })).toBe(false);
  });
});

describe('a private site', () => {
  it('is closed to people without a key', () => {
    expect(siteClosed(true, nobody)).toBe(true);
  });

  it('is open to guests of either role and to admins', () => {
    expect(siteClosed(true, visitor)).toBe(false);
    expect(siteClosed(true, investor)).toBe(false);
    expect(siteClosed(true, admin)).toBe(false);
  });

  it('is open to everyone once the setting is off', () => {
    expect(siteClosed(false, nobody)).toBe(false);
    expect(siteClosed(false, visitor)).toBe(false);
  });
});

describe('the Data Room tab', () => {
  it.each([
    '/data-room',
    '/data-room/',
    '/data-room/files',
    '/data-room/files?folder=abc',
    '/data-room#talk',
    'https://opero.example/data-room',
    '/investors',
    '/investors/',
    '/investors#talk',
    '/investors?from=nav',
    'https://opero.example/investors',
  ])('recognizes the room, and the old Investor Hub address, at %j', (href) => {
    expect(linksToDataRoom(href, site)).toBe(true);
    expect(linksToFounder(href, site)).toBe(false);
  });

  it.each(['/founder', '/founder/', '/founder#story', '/founder?from=nav', 'https://opero.example/founder'])('recognizes the Founder page at %j', (href) => {
    expect(linksToFounder(href, site)).toBe(true);
    expect(linksToDataRoom(href, site)).toBe(false);
  });

  it.each([
    '/partners',
    '/#platform',
    '#book-demo',
    '/investors-old',
    '/data-rooms',
    '/data-roomy/files',
    '/founders',
    'https://elsewhere.example/investors',
    'https://elsewhere.example/founder',
    'mailto:hello@operovia.com',
    'not a url at all ://',
  ])('leaves %j alone', (href) => {
    expect(linksToDataRoom(href, site)).toBe(false);
    expect(linksToFounder(href, site)).toBe(false);
  });

  it('shows the Founder tab and hides the hub tab while the hub is hidden', () => {
    expect(visibleLinks([partners, founder, hub], true, site)).toEqual([partners, founder]);
    expect(visibleLinks([partners, oldHub, files, founder], true, site)).toEqual([partners, founder]);
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
