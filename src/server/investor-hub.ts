import { FOUNDER_PATH, INVESTOR_HUB_PATH } from '@/content/constants';

/**
 * The Investor Hub shows only to people with a key: guests who came through
 * the front door and signed-in admins. Everyone else gets the public Founder
 * page instead, and exactly one of the two tabs is ever in the header.
 */
export function investorHubHidden(keyed: boolean): boolean {
  return !keyed;
}

/** Whether a link, written as a path or as a full address on this site, goes to the given page. */
function linksTo(href: string, siteUrl: string, path: string): boolean {
  try {
    const site = new URL(siteUrl);
    const url = new URL(href, site);
    return url.origin === site.origin && url.pathname.replace(/\/+$/, '') === path;
  } catch {
    return false;
  }
}

export function linksToInvestorHub(href: string, siteUrl: string): boolean {
  return linksTo(href, siteUrl, INVESTOR_HUB_PATH);
}

export function linksToFounder(href: string, siteUrl: string): boolean {
  return linksTo(href, siteUrl, FOUNDER_PATH);
}

/** Header or footer links: without the Investor Hub while it is hidden, without the Founder page while it is shown. */
export function visibleLinks<T extends { href: string }>(links: T[], hubHidden: boolean, siteUrl: string): T[] {
  return hubHidden ? links.filter((link) => !linksToInvestorHub(link.href, siteUrl)) : links.filter((link) => !linksToFounder(link.href, siteUrl));
}

/** A header or footer section with its links filtered the same way. */
export function withVisibleLinks<T extends { links: { href: string }[] }>(section: T, hubHidden: boolean, siteUrl: string): T {
  return { ...section, links: visibleLinks(section.links, hubHidden, siteUrl) };
}
