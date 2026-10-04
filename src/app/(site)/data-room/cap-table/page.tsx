import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/motion/reveal';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { CapTableSection } from '@/components/site/investors/cap-table';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { DATA_ROOM_CAP_TABLE_PATH } from '@/content/constants';
import { getPage } from '@/content/store';
import { cn } from '@/lib/cn';
import { dataRoomHidden } from '@/server/data-room-access';
import { getAccess, requireEntry } from '@/server/entry';

export async function generateMetadata(): Promise<Metadata> {
  const [{ room }, access] = await Promise.all([getPage('dataRoom'), getAccess()]);
  // Hidden pages give away nothing, not even their title.
  if (dataRoomHidden(access)) notFound();
  return {
    title: `${room.capTableTab} | ${room.label}`,
    description: room.metaDescription,
    alternates: { canonical: DATA_ROOM_CAP_TABLE_PATH },
    // Only guests and admins can open it; it stays out of search.
    robots: { index: false, follow: false },
  };
}

/** The Cap Table: the capitalization table today and after the round converts, with the investment model under it, and the small print. */
export default async function DataRoomCapTablePage() {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  const [{ round }, { room }] = await Promise.all([getPage('investors'), getPage('dataRoom')]);
  return (
    <>
      <RoomNav room={room} />
      <section aria-labelledby="cap-title" className="py-section">
        <Container>
          {round.eyebrow ? (
            <Reveal>
              <Eyebrow>{round.eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={0.05}>
            <h1 id="cap-title" className={cn('max-w-3xl text-display-sm font-medium text-metal', round.eyebrow && 'mt-5')}>
              {round.capHeading}
            </h1>
          </Reveal>
          <CapTableSection content={round} />
        </Container>
      </section>
    </>
  );
}
