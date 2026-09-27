import type { Metadata } from 'next';
import { Closing } from '@/components/site/home/closing';
import { Hero } from '@/components/site/home/hero';
import { OppieSection } from '@/components/site/home/oppie';
import { PartnerInvite } from '@/components/site/home/partner';
import { Platform } from '@/components/site/home/platform';
import { Problem } from '@/components/site/home/problem';
import { Proof } from '@/components/site/home/proof';
import { openGraph } from '@/content/metadata';
import { getPage, getPublicSettings, getScenes } from '@/content/store';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return {
    title: { absolute: settings.homeMetaTitle },
    alternates: { canonical: '/' },
    openGraph: await openGraph({ title: settings.homeMetaTitle, description: settings.homeMetaDescription, url: '/' }),
  };
}

export default async function HomePage() {
  const [home, scenes] = await Promise.all([getPage('home'), getScenes()]);
  return (
    <>
      <Hero content={home.hero} scenes={scenes} />
      <Problem content={home.problem} />
      <Platform content={home.platform} />
      <OppieSection content={home.oppie} />
      <Proof content={home.proof} />
      <PartnerInvite content={home.partner} />
      <Closing content={home.closing} />
    </>
  );
}
