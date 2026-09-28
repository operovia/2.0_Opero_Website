import { describe, expect, it } from 'vitest';
import { investorHubHidden, linksToInvestorHub, visibleLinks } from './investor-hub';

const site = 'https://opero.example';

describe('Investor Hub visibility', () => {
  it('is hidden only from visitors, and only while switched off', () => {
    expect(investorHubHidden({ investorHubEnabled: false }, false)).toBe(true);
    expect(investorHubHidden({ investorHubEnabled: false }, true)).toBe(false);
    expect(investorHubHidden({ investorHubEnabled: true }, false)).toBe(false);
  });

  it.each(['/investors', '/investors/', '/investors#talk', '/investors?from=nav', 'https://opero.example/investors'])('recognizes %j', (href) => {
    expect(linksToInvestorHub(href, site)).toBe(true);
  });

  it.each(['/partners', '/#platform', '#book-demo', '/investors-old', 'https://elsewhere.example/investors', 'mailto:hello@operovia.com'])(
    'leaves %j alone',
    (href) => {
      expect(linksToInvestorHub(href, site)).toBe(false);
    },
  );

  it('drops Investor Hub links only while it is hidden', () => {
    const links = [
      { label: 'Design partners', href: '/partners' },
      { label: 'Investor Hub', href: '/investors' },
    ];
    expect(visibleLinks(links, true, site)).toEqual([links[0]]);
    expect(visibleLinks(links, false, site)).toEqual(links);
  });
});
