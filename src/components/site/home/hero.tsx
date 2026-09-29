import { RichText } from '@/components/rich-text';
import type { ConsoleScene } from '@/content/store';
import type { SectionData } from '@/content/registry';
import { withLineBreaks } from '@/lib/headline';
import { Aurora } from '../aurora';
import { Container, SiteButton } from '../layout-parts';
import { OppieConsole } from '../oppie-console';

export function Hero({ content, scenes }: { content: SectionData<'home', 'hero'>; scenes: ConsoleScene[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-18 overflow-hidden pt-18">
      <Aurora />
      <Container className="grid grid-cols-1 items-center gap-14 pt-12 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:pt-24 lg:pb-24">
        <div>
          <h1 id="hero-title" className="hero-rise text-display-lg font-medium text-metal">
            {withLineBreaks(content.headline, { emphasis: true })}
          </h1>
          <RichText doc={content.subhead} className="hero-fade mt-7 max-w-xl text-lg text-fg-muted sm:text-xl" />
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
