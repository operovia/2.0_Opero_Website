import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/motion/reveal';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { BuildPlan } from '@/components/site/investors/build-plan';
import { RaiseTerms } from '@/components/site/investors/raise-terms';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { DATA_ROOM_RAISE_PATH } from '@/content/constants';
import { getPage, getSectionProblems } from '@/content/store';
import { cn } from '@/lib/cn';
import { renderHeadline } from '@/lib/headline';
import { dataRoomHidden } from '@/server/data-room-access';
import { getAccess, requireEntry } from '@/server/entry';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const [{ room }, access] = await Promise.all([getPage('dataRoom'), getAccess()]);
  // Hidden pages give away nothing, not even their title.
  if (dataRoomHidden(access)) notFound();
  return {
    title: `${room.raiseTab} | ${room.label}`,
    description: room.metaDescription,
    alternates: { canonical: DATA_ROOM_RAISE_PATH },
    // Only guests and admins can open it; it stays out of search.
    robots: { index: false, follow: false },
  };
}

/**
 * The Raise: the round's terms and what the investor gets, then what runs
 * today against what the raise builds, area by area, and the small print.
 * It presents the terms; it never offers investment.
 */
export default async function DataRoomRaisePage() {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  await noteVisit(DATA_ROOM_RAISE_PATH);
  const [{ next, platform, round }, { room }, problems] = await Promise.all([
    getPage('investors'),
    getPage('dataRoom'),
    getSectionProblems('investors', 'round'),
  ]);
  // Saved figures that cannot even be read are never replaced by the shipped ones: the terms wait until they are fixed.
  const unreadable = problems.some((problem) => problem.kind === 'fields');
  return (
    <>
      <RoomNav room={room} />
      <section aria-labelledby="raise-title" className="py-section">
        <Container>
          {round.eyebrow ? (
            <Reveal>
              <Eyebrow>{round.eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={0.05}>
            <h1 id="raise-title" className={cn('max-w-3xl text-display-sm font-medium text-metal', round.eyebrow && 'mt-5')}>
              {renderHeadline(round.termsHeading)}
            </h1>
          </Reveal>
          {unreadable ? null : <RaiseTerms content={round} />}
        </Container>
      </section>
      <BuildPlan next={next} platform={platform} />
      <Container>
        <p className="max-w-3xl py-10 text-sm text-fg-subtle">{round.disclaimer}</p>
      </Container>
    </>
  );
}
