import type { Metadata } from 'next';
import { SiteFrame, siteMetadata } from '@/components/site/site-frame';
import { requireEntry } from '@/server/entry';

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata();
}

/** The site behind its gate: every page here calls requireEntry too, since a layout is not run again on a client-side navigation. */
export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const access = await requireEntry();
  return <SiteFrame access={access}>{children}</SiteFrame>;
}
