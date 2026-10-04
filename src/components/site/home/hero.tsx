import { DoorArrival } from '@/components/door/door-arrival';
import type { ConsoleScene } from '@/content/store';
import type { SectionData } from '@/content/registry';
import { fillName } from '@/lib/greeting';
import { renderHeadline } from '@/lib/headline';
import { Aurora } from '../aurora';
import { Carpet } from '../carpet';
import { Container } from '../layout-parts';
import { OppieConsole } from '../oppie-console';

/**
 * The first screen: the headline, the points, the figures, and the Oppie
 * console. One grid in two orders: on phones the headline, then the card,
 * then the points and the figures, so the headline and the whole card share
 * the first screen; from lg the card stands in a second column beside the
 * whole left stack. The data-testid hooks are for the layout checks
 * (scripts/check-layout.mjs). `greeting`: the welcome name of the guest
 * looking, from the guest list, or empty for everyone else. `stats`: the
 * proof section's stats, of which those with a strip label stand two by two
 * under the points, so the two never drift apart.
 */
export function Hero({
  content,
  scenes,
  greeting,
  stats,
}: {
  content: SectionData<'home', 'hero'>;
  scenes: ConsoleScene[];
  greeting: string;
  stats: SectionData<'home', 'proof'>['stats'];
}) {
  const figures = stats.filter((stat) => stat.short);
  return (
    <section aria-labelledby="hero-title" data-door-hero className="relative isolate -mt-18 overflow-hidden pt-18">
      {/* A guest arriving through the front door lands here; the veil holds this first frame until the hero has mounted. */}
      <DoorArrival />
      <Aurora />
      <Container className="grid grid-cols-1 gap-x-16 pt-4 pb-12 sm:pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:pt-10 lg:pb-16">
        {greeting ? (
          <div className="hero-fade order-first mb-5 flex w-fit flex-col gap-3 sm:mb-6 lg:col-start-1">
            <p className="text-xl font-medium text-metal sm:text-2xl">{renderHeadline(fillName(content.guestGreeting, greeting))}</p>
            <Carpet className="hero-carpet" />
          </div>
        ) : null}
        <h1 id="hero-title" className="hero-rise order-1 text-display-hero font-medium text-metal lg:col-start-1">
          {renderHeadline(content.headline)}
        </h1>
        {/* After the headline on phones; beside the whole left column from lg, where it takes the three rows the column fills. */}
        <div data-testid="hero-oppie-card" className="hero-fade order-2 mt-4 lg:col-start-2 lg:row-span-3 lg:mt-0 [animation-delay:240ms]">
          <OppieConsole
            scenes={scenes}
            labels={{
              footerLeft: content.consoleFooterLeft,
              footerRight: content.consoleFooterRight,
              note: content.consoleNote,
            }}
          />
        </div>
        <ul data-testid="hero-bullets" className="hero-fade order-3 mt-6 max-w-xl space-y-2.5 text-base text-fg-muted lg:col-start-1 xl:text-lg">
          {content.points.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
              <span>{point.text}</span>
            </li>
          ))}
        </ul>
        {/* The figures: the same as the proof section's, two by two, each label under its figure. */}
        {figures.length ? (
          <ul data-testid="hero-stats" className="hero-fade order-4 mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 lg:col-start-1 [animation-delay:120ms]">
            {figures.map((stat, i) => (
              <li key={i} className="border-t border-line pt-4">
                <p className="text-2xl font-semibold text-fg tabular-nums">{stat.value}</p>
                <p className="mt-1 text-sm text-fg-muted">{stat.short}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}
