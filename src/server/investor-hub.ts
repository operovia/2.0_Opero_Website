import { FOUNDER_PATH, type GuestRole, INVESTOR_HUB_PATH } from '@/content/constants';

/** Who is looking: a signed-in admin, a guest who came through the front door with a role, or nobody in particular. */
export type Access = { admin: boolean; role: GuestRole | null };

/**
 * The Investor Hub shows only to signed-in admins and to guests invited as
 * investors. Everyone else gets the Founder page instead, and exactly one of
 * the two tabs is ever in the header.
 */
export function investorHubHidden({ admin, role }: Access): boolean {
  return !admin && role !== 'investor';
}

/** While the site is private, only admins and guests of either role see it; everyone else is sent to the front door. */
export function siteClosed(privateSite: boolean, { admin, role }: Access): boolean {
  return privateSite && !admin && role === null;
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
