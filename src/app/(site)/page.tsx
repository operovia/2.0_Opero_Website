import type { Metadata } from 'next';
import { Closing } from '@/components/site/home/closing';
import { Go } from '@/components/site/home/go';
import { Hero } from '@/components/site/home/hero';
import { OppieSection } from '@/components/site/home/oppie';
import { PartnerInvite } from '@/components/site/home/partner';
import { Platform } from '@/components/site/home/platform';
import { Problem } from '@/components/site/home/problem';
import { Proof } from '@/components/site/home/proof';
import { DOOR_INVITE_PARAM } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage, getPublicSettings, getScenes } from '@/content/store';
import { requireEntry } from '@/server/entry';
import { greetingFor } from '@/server/guests';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return {
    title: { absolute: settings.homeMetaTitle },
    alternates: { canonical: '/' },
    openGraph: await openGraph({ title: settings.homeMetaTitle, description: settings.homeMetaDescription, url: '/' }),
  };
}

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const access = await requireEntry();
  await noteVisit('/');
  const [home, scenes, greeting] = await Promise.all([
    getPage('home'),
    getScenes(),
    searchParams.then((params) => greetingFor(access.admin, params[DOOR_INVITE_PARAM])),
  ]);
  return (
    <>
      <Hero content={home.hero} scenes={scenes} greeting={greeting} stats={home.proof.stats} />
      <Problem content={home.problem} />
      <Platform content={home.platform} />
      <OppieSection content={home.oppie} />
      <Go content={home.go} />
      <Proof content={home.proof} />
      <PartnerInvite content={home.partner} />
      <Closing content={home.closing} />
    </>
  );
}
