import { ArrowDown, ArrowRight, Check, CircleDashed } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { RoomNav } from '@/components/site/data-room/room-nav';
import { InvestorInquiryForm } from '@/components/site/investor-inquiry-form';
import { FounderIntro } from '@/components/site/founder/intro';
import { FounderStory } from '@/components/site/founder/story';
import { RoundSection } from '@/components/site/investors/round';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { DATA_ROOM_PATH } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage } from '@/content/store';
import { cn } from '@/lib/cn';
import { renderHeadline } from '@/lib/headline';
import { dataRoomHidden } from '@/server/data-room-access';
import { getAccess, requireEntry } from '@/server/entry';

export async function generateMetadata(): Promise<Metadata> {
  const [{ intro }, { room }, access] = await Promise.all([getPage('investors'), getPage('dataRoom'), getAccess()]);
  // Hidden pages give away nothing, not even their title.
  if (dataRoomHidden(access)) notFound();
  const title = `${room.overviewTab} | ${room.label}`;
  return {
    title,
    description: intro.description,
    alternates: { canonical: DATA_ROOM_PATH },
    openGraph: await openGraph({ title: room.label, description: intro.description, url: DATA_ROOM_PATH }),
    // Only guests and admins can open it; it stays out of search.
    robots: { index: false, follow: false },
  };
}

/** The items in a one-per-line list from the admin. */
const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * The Data Room's Overview, the former Investor Hub: the founder's story,
 * what runs today and what is on deck, the round's terms, and the contact
 * form. The documents are under the Documents tab (./files).
 */
export default async function DataRoomOverviewPage() {
  const access = await requireEntry();
  if (dataRoomHidden(access)) notFound();
  const [{ intro, letter, story, next, platform, round, contact }, { room }] = await Promise.all([getPage('investors'), getPage('dataRoom')]);
  const areas = platform.areas.map((area) => ({ name: area.name, today: lines(area.today), extended: lines(area.extended), next: lines(area.next) }));
  // Worked out from the lists, so they always agree with them.
  const runningToday = areas.reduce((sum, area) => sum + area.today.length + area.extended.length, 0);
  const onDeck = areas.reduce((sum, area) => sum + area.next.length, 0);

  return (
    <>
      <RoomNav label={room.label} tabs={{ overview: room.overviewTab, documents: room.documentsTab }} />
      {/* No eyebrow here: the strip above already names the room. */}
      <FounderIntro intro={intro} letter={letter} eyebrow="" titleId="investors-title" />
      <FounderStory story={story} />

      <section aria-labelledby="next-title" className="border-y border-line bg-canvas-raised py-section">
        <Container>
          <Reveal>
            <Eyebrow>{next.heading}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="next-title" className="mt-5 max-w-3xl text-display-sm font-medium text-metal">
              {renderHeadline(platform.headline)}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-lg text-fg-muted">{platform.intro}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
            <Reveal className="rounded-2xl border border-line bg-surface p-7 shadow-md sm:p-9">
              <p className="flex items-center gap-2.5 text-micro font-semibold text-fg-subtle uppercase">
                <span aria-hidden className="size-2 rounded-full bg-success" />
                {next.todayLabel}
              </p>
              <h3 className="mt-5 text-2xl font-semibold text-fg">{next.todayTitle}</h3>
              <p className="mt-3 text-base text-fg-muted">{next.todayBody}</p>
            </Reveal>
            <div aria-hidden className="flex items-center justify-center text-fg-subtle">
              <ArrowRight className="hidden size-6 md:block" />
              <ArrowDown className="size-6 md:hidden" />
            </div>
            <Reveal delay={0.1} className="investor-blueprint rounded-2xl border border-dashed border-line-strong p-7 sm:p-9">
              <p className="flex items-center gap-2.5 text-micro font-semibold text-fg-subtle uppercase">
                <span aria-hidden className="size-2 rounded-full border border-fg-subtle" />
                {next.nextLabel}
              </p>
              <h3 className="mt-5 text-2xl font-semibold text-fg">{next.nextTitle}</h3>
              <p className="mt-3 text-base text-fg-muted">{next.nextBody}</p>
            </Reveal>
          </div>

          <Reveal className="mt-14">
            <p className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-muted">
              <span className="inline-flex items-center gap-2">
                <Check aria-hidden className="size-4 text-success" />
                {platform.todayLabel}
                <span className="font-semibold text-fg tabular-nums">{runningToday}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <CircleDashed aria-hidden className="size-4 text-fg-subtle" />
                {platform.nextLabel}
                <span className="font-semibold text-fg tabular-nums">{onDeck}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full border border-line-strong px-1.5 text-micro font-semibold text-fg-subtle uppercase">
                  {platform.extendedLabel}
                </span>
                {platform.extendedNote}
              </span>
            </p>
          </Reveal>
          <RevealGroup as="ul" className="mt-6 columns-1 gap-4 md:columns-2 lg:columns-3">
            {areas.map((area, i) => (
              <RevealItem as="li" key={area.name + i} className="mb-4 break-inside-avoid rounded-2xl border border-line bg-surface p-6">
                <h3 className="text-lg font-semibold text-fg">{area.name}</h3>
                {area.today.length + area.extended.length ? (
                  <ul aria-label={platform.todayLabel} className="mt-4 space-y-2.5">
                    {[...area.today.map((item) => ({ item, extended: false })), ...area.extended.map((item) => ({ item, extended: true }))].map(
                      ({ item, extended }) => (
                        <li key={item} className="flex gap-2.5 text-sm text-fg-muted">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                          <span className="min-w-0 flex-1">{item}</span>
                          {extended ? (
                            <span className="mt-px shrink-0 self-start rounded-full border border-line-strong px-1.5 text-micro font-semibold text-fg-subtle uppercase">
                              {platform.extendedLabel}
                            </span>
                          ) : null}
                        </li>
                      ),
                    )}
                  </ul>
                ) : null}
                {area.next.length ? (
                  <ul aria-label={platform.nextLabel} className="mt-4 space-y-2.5 border-t border-dashed border-line-strong pt-4">
                    {area.next.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-fg">
                        <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* The round's terms, the investment model, and the cap table: for guests and admins, who are the only ones who reach this page. */}
      <section aria-labelledby="round-title" className="py-section">
        <Container>
          {round.eyebrow ? (
            <Reveal>
              <Eyebrow>{round.eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={0.05}>
            <h2 id="round-title" className={cn('max-w-3xl text-display-sm font-medium text-metal', round.eyebrow && 'mt-5')}>
              {renderHeadline(round.termsHeading)}
            </h2>
          </Reveal>
          <RoundSection content={round} />
        </Container>
      </section>

      <section id="talk" aria-labelledby="talk-title" className="scroll-mt-18 py-section">
        <Container size="3xl">
          <div className="investor-glass rounded-2xl p-6 sm:p-10">
            <h2 id="talk-title" className="text-display-sm font-medium text-metal">
              {renderHeadline(contact.headline)}
            </h2>
            <p className="mt-4 text-lg text-fg-muted">{contact.intro}</p>
            <div className="mt-10">
              <InvestorInquiryForm content={contact} />
            </div>
          </div>
          <p className="mt-8 text-sm text-fg-subtle">{contact.disclaimer}</p>
        </Container>
      </section>
    </>
  );
}
