import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { FounderIntro } from '@/components/site/founder/intro';
import { FounderStory } from '@/components/site/founder/story';
import { DATA_ROOM_PATH } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage } from '@/content/store';
import { dataRoomHidden } from '@/server/data-room-access';
import { getAccess, requireEntry } from '@/server/entry';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const [{ intro }, { room }, access] = await Promise.all([getPage('investors'), getPage('dataRoom'), getAccess()]);
  // Hidden pages give away nothing, not even their title.
  if (dataRoomHidden(access)) notFound();
  return {
    title: `${room.founderTab} | ${room.label}`,
    description: intro.description,
    alternates: { canonical: DATA_ROOM_PATH },
    openGraph: await openGraph({ title: room.label, description: intro.description, url: DATA_ROOM_PATH }),
    // Only guests and admins can open it; it stays out of search.
    robots: { index: false, follow: false },
  };
}

/**
 * The Data Room's first tab, Founder: the founder's introduction and story,
 * the same two sections the public Founder page shows. The Raise, the Cap
 * Table and the Documents are the other tabs.
 */
export default async function DataRoomFounderPage() {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  await noteVisit(DATA_ROOM_PATH);
  const [{ intro, letter, story }, { room }] = await Promise.all([getPage('investors'), getPage('dataRoom')]);
  return (
    <>
      <RoomNav room={room} />
      {/* No eyebrow here: the strip above already names the room, and the section starts below the strip rather than rising behind it. */}
      <FounderIntro intro={intro} letter={letter} eyebrow="" titleId="investors-title" rise={false} />
      <FounderStory story={story} />
    </>
  );
}
