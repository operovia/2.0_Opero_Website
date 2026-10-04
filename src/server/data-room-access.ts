import { DATA_ROOM_PATH, FOUNDER_PATH, type GuestRole, INVESTOR_HUB_PATH } from '@/content/constants';

/**
 * Who is looking: a signed-in admin, a guest who came through the front door
 * with a role, or nobody in particular. `asVisitor` is an admin who switched
 * to seeing the site as a visitor does (getAccess reads it only for admins).
 */
export type Access = { admin: boolean; role: GuestRole | null; asVisitor?: boolean };

/**
 * The Data Room (its Overview, its documents, and every file in it) shows
 * only to signed-in admins and to guests invited as investors. Everyone else
 * gets the Founder page instead, and exactly one of the two tabs is ever in
 * the header. An admin viewing the site as a visitor gets the visitor's side.
 */
export function dataRoomHidden({ admin, role, asVisitor }: Access): boolean {
  return asVisitor === true || (!admin && role !== 'investor');
}

/** While the site is private, only admins and guests of either role see it; everyone else is sent to the front door. */
export function siteClosed(privateSite: boolean, { admin, role }: Access): boolean {
  return privateSite && !admin && role === null;
}

/** Whether a link, written as a path or as a full address on this site, goes to the given page, or (`inside`) to a page under it. */
function linksTo(href: string, siteUrl: string, path: string, inside = false): boolean {
  try {
    const site = new URL(siteUrl);
    const url = new URL(href, site);
    const pathname = url.pathname.replace(/\/+$/, '');
    return url.origin === site.origin && (pathname === path || (inside && pathname.startsWith(`${path}/`)));
  } catch {
    return false;
  }
}

/** A link into the Data Room, or to the Investor Hub's old address, which forwards there. */
export function linksToDataRoom(href: string, siteUrl: string): boolean {
  return linksTo(href, siteUrl, DATA_ROOM_PATH, true) || linksTo(href, siteUrl, INVESTOR_HUB_PATH);
}

export function linksToFounder(href: string, siteUrl: string): boolean {
  return linksTo(href, siteUrl, FOUNDER_PATH);
}

/** Header or footer links: without the Data Room while it is hidden, without the Founder page while it is shown. */
export function visibleLinks<T extends { href: string }>(links: T[], hubHidden: boolean, siteUrl: string): T[] {
  return hubHidden ? links.filter((link) => !linksToDataRoom(link.href, siteUrl)) : links.filter((link) => !linksToFounder(link.href, siteUrl));
}

/** A header or footer section with its links filtered the same way. */
export function withVisibleLinks<T extends { links: { href: string }[] }>(section: T, hubHidden: boolean, siteUrl: string): T {
  return { ...section, links: visibleLinks(section.links, hubHidden, siteUrl) };
}
