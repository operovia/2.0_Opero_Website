import Image from 'next/image';
import founderPortrait from '@/assets/founder-portrait.jpg';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { LinkedInGlyph } from '@/components/site/linkedin-glyph';
import { SiteLink } from '@/components/site/site-link';
import type { SectionData } from '@/content/registry';
import { renderHeadline } from '@/lib/headline';
import { FounderLetter } from './letter';

type Props = {
  /** The Data Room overview's introduction: headline, name, role, and LinkedIn profile. */
  intro: SectionData<'investors', 'intro'>;
  /** The founder's letter, opened by the button under the headline. */
  letter: SectionData<'investors', 'letter'>;
  /** The small line above the headline. Each page brings its own. */
  eyebrow: string;
  /** The id of the headline, for the section's aria-labelledby. */
  titleId: string;
};

/**
 * The founder's introduction: the headline in the founder's voice, with the
 * button to his letter under it, beside the portrait, signed with name, role,
 * and the LinkedIn icon. The top of both the Data Room overview and the public
 * Founder page.
 */
export function FounderIntro({ intro, letter, eyebrow, titleId }: Props) {
  return (
    <section aria-labelledby={titleId} className="relative isolate -mt-18 overflow-hidden pt-18">
      <div aria-hidden className="investor-grid absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
        <div className="investor-glow" />
        <div className="investor-glow investor-glow-2" />
      </div>
      <Container className="grid grid-cols-1 items-center gap-10 pt-16 pb-16 sm:pt-24 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div>
          {eyebrow ? <Eyebrow className="hero-fade">{eyebrow}</Eyebrow> : null}
          <h1 id={titleId} className="hero-rise mt-5 max-w-4xl text-display-lg font-medium text-metal">
            {renderHeadline(intro.headline)}
          </h1>
          <div className="hero-rise">
            <FounderLetter letter={letter} />
          </div>
        </div>
        {/* The portrait from the investor room in the Opero repo, as supplied. Signed beneath, like the original. */}
        <figure className="hero-rise flex items-center gap-5 lg:flex-col lg:items-start">
          <Image
            src={founderPortrait}
            alt={intro.name}
            placeholder="blur"
            preload
            sizes="(min-width: 64rem) 18rem, (min-width: 40rem) 7rem, 5rem"
            className="h-auto w-20 shrink-0 rounded-xl border border-line-strong shadow-lg sm:w-28 lg:w-72 lg:rounded-2xl"
          />
          {/* As wide as the photo on large screens, so the LinkedIn icon lines up with its right edge. */}
          <figcaption className="min-w-0 flex-1 lg:w-72 lg:flex-none">
            <span className="flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-fg">{intro.name}</span>
              {intro.linkedin ? (
                <SiteLink
                  href={intro.linkedin}
                  aria-label={`${intro.name} on LinkedIn`}
                  className="-my-1 grid size-8 shrink-0 place-items-center rounded-sm border border-line-strong bg-surface text-linkedin transition-colors hover:border-fg-subtle hover:bg-surface-raised"
                >
                  <LinkedInGlyph className="size-4" />
                </SiteLink>
              ) : null}
            </span>
            <span className="mt-1 block text-eyebrow font-semibold text-fg-subtle uppercase">{intro.role}</span>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
