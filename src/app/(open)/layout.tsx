import type { Metadata } from 'next';
import { SiteFrame, siteMetadata } from '@/components/site/site-frame';
import { getAccess } from '@/server/entry';

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata();
}

/**
 * The pages everyone may read, key or none, while the site is private: the
 * privacy notice. The site's frame without its gate; who is looking still
 * decides which links the frame shows.
 */
export default async function OpenLayout({ children }: LayoutProps<'/'>) {
  const access = await getAccess();
  return <SiteFrame access={access}>{children}</SiteFrame>;
}
