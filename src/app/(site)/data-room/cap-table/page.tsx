import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/motion/reveal';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { CapTableSection } from '@/components/site/investors/cap-table';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { DATA_ROOM_CAP_TABLE_PATH } from '@/content/constants';
import { getPage, getSectionProblems } from '@/content/store';
import { cn } from '@/lib/cn';
import { dataRoomHidden } from '@/server/data-room-access';
import { getAccess, requireEntry } from '@/server/entry';
import { noteVisit } from '@/server/visits';

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

/**
 * The Cap Table: the capitalization table today and after the round
 * converts, with the investment model under it, and the small print. If the
 * saved figures fail the checks (src/content/resolve.ts), the table is held
 * back, never shown with the shipped figures: a short message stands in its
 * place, and the admin says what to fix.
 */
export default async function DataRoomCapTablePage() {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  await noteVisit(DATA_ROOM_CAP_TABLE_PATH);
  const [{ round }, { room }, problems] = await Promise.all([getPage('investors'), getPage('dataRoom'), getSectionProblems('investors', 'round')]);
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
          {problems.length ? (
            <Reveal className="mt-10">
              <p data-testid="cap-withheld" className="mt-6 rounded-2xl border border-line bg-surface px-6 py-8 text-base text-fg-muted">
                {round.withheldMessage}
              </p>
              <p className="mt-12 max-w-3xl text-sm text-fg-subtle">{round.disclaimer}</p>
            </Reveal>
          ) : (
            <CapTableSection content={round} />
          )}
        </Container>
      </section>
    </>
  );
}
