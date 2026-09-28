import { INVESTOR_HUB_PATH } from '@/content/constants';

/**
 * The Investor Hub stays hidden from visitors until an admin switches it on
 * in Settings. Signed-in admins always see it, so they can review it first.
 */
export function investorHubHidden(settings: { investorHubEnabled: boolean }, signedIn: boolean): boolean {
  return !settings.investorHubEnabled && !signedIn;
}

/** Whether a link, written as a path or as a full address on this site, goes to the Investor Hub. */
export function linksToInvestorHub(href: string, siteUrl: string): boolean {
  try {
    const site = new URL(siteUrl);
    const url = new URL(href, site);
    return url.origin === site.origin && url.pathname.replace(/\/+$/, '') === INVESTOR_HUB_PATH;
  } catch {
    return false;
  }
}

/** Header or footer links, leaving out any to the Investor Hub while it is hidden. */
export function visibleLinks<T extends { href: string }>(links: T[], hubHidden: boolean, siteUrl: string): T[] {
  return hubHidden ? links.filter((link) => !linksToInvestorHub(link.href, siteUrl)) : links;
}
