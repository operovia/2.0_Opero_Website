import type { Metadata } from 'next';
import { FounderIntro } from '@/components/site/founder/intro';
import { FounderStory } from '@/components/site/founder/story';
import { FOUNDER_PATH } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage } from '@/content/store';
import { plainHeadline } from '@/lib/headline';
import { requireEntry } from '@/server/entry';

export async function generateMetadata(): Promise<Metadata> {
  const [{ page }, { intro }] = await Promise.all([getPage('founder'), getPage('investors')]);
  // The eyebrow names the page; without one, the headline itself does.
  const title = page.eyebrow || plainHeadline(intro.headline);
  return {
    title,
    description: page.description,
    alternates: { canonical: FOUNDER_PATH },
    openGraph: await openGraph({ title, description: page.description, url: FOUNDER_PATH }),
  };
}

/**
 * The public Founder page: the founder's introduction and story, read from
 * the Investor Hub's sections so both pages always say the same thing.
 */
export default async function FounderPage() {
  await requireEntry();
  const [{ page }, { intro, letter, story }] = await Promise.all([getPage('founder'), getPage('investors')]);
  return (
    <>
      <FounderIntro intro={intro} letter={letter} eyebrow={page.eyebrow} titleId="founder-title" />
      <FounderStory story={story} />
    </>
  );
}
