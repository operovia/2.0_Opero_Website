import { DoorArrival } from '@/components/door/door-arrival';
import type { ConsoleScene } from '@/content/store';
import type { SectionData } from '@/content/registry';
import { fillName } from '@/lib/greeting';
import { renderHeadline } from '@/lib/headline';
import { Aurora } from '../aurora';
import { Carpet } from '../carpet';
import { Container, SiteButton } from '../layout-parts';
import { OppieConsole } from '../oppie-console';

/** `greeting`: the welcome name of the guest looking, from the guest list, or empty for everyone else. */
export function Hero({ content, scenes, greeting }: { content: SectionData<'home', 'hero'>; scenes: ConsoleScene[]; greeting: string }) {
  return (
    <section aria-labelledby="hero-title" data-door-hero className="relative isolate -mt-18 overflow-hidden pt-18">
      {/* A guest arriving through the front door lands here; the veil holds this first frame until the hero has mounted. */}
      <DoorArrival />
      <Aurora />
      <Container className="grid grid-cols-1 items-center gap-14 pt-12 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:pt-24 lg:pb-24">
        <div>
          {greeting ? (
            <div className="hero-fade mb-6 flex w-fit flex-col gap-3 sm:mb-8">
              <p className="text-xl font-medium text-metal sm:text-2xl">{renderHeadline(fillName(content.guestGreeting, greeting))}</p>
              <Carpet className="hero-carpet" />
            </div>
          ) : null}
          <h1 id="hero-title" className="hero-rise text-display-lg font-medium text-metal">
            {renderHeadline(content.headline)}
          </h1>
          <ul data-testid="hero-bullets" className="hero-fade mt-7 max-w-xl space-y-3 text-lg text-fg-muted sm:text-xl">
            {content.points.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-3 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
                <span>{point.text}</span>
              </li>
            ))}
          </ul>
          <div className="hero-fade mt-10 [animation-delay:120ms]">
            <SiteButton href={content.buttonTarget} size="lg">
              {content.buttonLabel}
            </SiteButton>
          </div>
          <p className="hero-fade mt-6 max-w-md text-sm text-fg-subtle [animation-delay:180ms]">{content.supportingLine}</p>
        </div>
        <div className="hero-fade [animation-delay:240ms]">
          <OppieConsole
            scenes={scenes}
            labels={{
              badge: content.consoleBadge,
              footerLeft: content.consoleFooterLeft,
              footerRight: content.consoleFooterRight,
              note: content.consoleNote,
            }}
          />
        </div>
      </Container>
    </section>
  );
}
