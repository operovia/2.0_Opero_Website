import { ArrowDown, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import founderPortrait from '@/assets/founder-portrait.jpg';
import { Reveal } from '@/components/motion/reveal';
import { InvestorInquiryForm } from '@/components/site/investor-inquiry-form';
import { JoinedModules, ScatteredApps, StoryLine } from '@/components/site/investors/story-visuals';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { INVESTOR_HUB_PATH } from '@/content/constants';
import { openGraph } from '@/content/metadata';
import { getPage, getPublicSettings } from '@/content/store';
import { cn } from '@/lib/cn';
import { getSession } from '@/server/auth/session';
import { investorHubHidden } from '@/server/investor-hub';

export async function generateMetadata(): Promise<Metadata> {
  const [{ intro }, { settings }, session] = await Promise.all([getPage('investors'), getPublicSettings(), getSession()]);
  // Hidden pages give away nothing, not even their title.
  if (investorHubHidden(settings, session !== null)) notFound();
  const title = intro.eyebrow || 'Investor Hub';
  return {
    title,
    description: intro.description,
    alternates: { canonical: INVESTOR_HUB_PATH },
    openGraph: await openGraph({ title, description: intro.description, url: INVESTOR_HUB_PATH }),
    // While it is switched off only admins can open it; keep it out of search.
    ...(settings.investorHubEnabled ? {} : { robots: { index: false, follow: false } }),
  };
}

/** The dots where each step meets the line across the story: gray through the problem, a jewel at the solution. */
const nodes = ['bg-line-strong', 'bg-line-strong', 'jewel-build'];

export default async function InvestorsPage() {
  const [{ settings }, session] = await Promise.all([getPublicSettings(), getSession()]);
  if (investorHubHidden(settings, session !== null)) notFound();
  const { intro, story, next, contact } = await getPage('investors');

  const steps = [
    {
      picture: (
        <span className="text-numeral font-medium text-metal tabular-nums" aria-hidden>
          {story.experienceValue}
        </span>
      ),
      title: (
        <>
          <span className="sr-only">{story.experienceValue} </span>
          {story.experienceTitle}
        </>
      ),
      body: story.experienceBody,
    },
    { picture: <ScatteredApps />, title: story.problemTitle, body: story.problemBody },
    { picture: <JoinedModules className="mb-2" />, title: story.solutionTitle, body: story.solutionBody },
  ];

  return (
    <>
      <section aria-labelledby="investors-title" className="relative isolate -mt-18 overflow-hidden pt-18">
        <div aria-hidden className="investor-grid absolute inset-0 -z-10" />
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
          <div className="investor-glow" />
          <div className="investor-glow investor-glow-2" />
        </div>
        <Container className="grid grid-cols-1 items-center gap-10 pt-16 pb-16 sm:pt-24 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            {settings.investorHubEnabled ? null : (
              <p
                role="status"
                className="hero-fade mb-8 inline-flex flex-wrap items-center gap-x-2 rounded-full border border-warning/40 bg-warning-soft px-4 py-1.5 text-sm text-fg"
              >
                Only signed-in admins can see this page.
                <Link href="/admin/settings" className="font-semibold underline underline-offset-4">
                  Show it to visitors in Settings
                </Link>
              </p>
            )}
            {intro.eyebrow ? <Eyebrow className="hero-fade">{intro.eyebrow}</Eyebrow> : null}
            <h1 id="investors-title" className="hero-rise mt-5 max-w-4xl text-display-lg font-medium text-metal">
              {intro.headline}
            </h1>
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
            <figcaption>
              <span className="block text-base font-semibold text-fg">{intro.name}</span>
              <span className="mt-1 block text-eyebrow font-semibold text-fg-subtle uppercase">{intro.role}</span>
            </figcaption>
          </figure>
        </Container>
      </section>

      <section className="pb-section">
        <Container>
          <div className="relative">
            <StoryLine className="absolute inset-x-0 top-1.5 hidden md:block" />
            <ol className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10">
              {steps.map((step, i) => (
                <li key={i}>
                  <Reveal delay={i * 0.12}>
                    <div className="flex items-center gap-3">
                      <span aria-hidden className={cn('relative size-3 rounded-full ring-4 ring-canvas', nodes[i])} />
                      <span aria-hidden className="text-eyebrow font-semibold text-fg-subtle tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="investor-anchor mt-8 flex items-end">{step.picture}</div>
                    <h2 className="mt-6 text-xl font-semibold text-fg">{step.title}</h2>
                    {step.body ? <p className="mt-3 max-w-sm text-base text-fg-muted">{step.body}</p> : null}
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section aria-labelledby="next-title" className="border-y border-line bg-canvas-raised py-section">
        <Container size="5xl">
          <Reveal>
            <h2 id="next-title" className="text-eyebrow font-semibold text-fg-subtle uppercase">
              {next.heading}
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
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
        </Container>
      </section>

      <section id="talk" aria-labelledby="talk-title" className="scroll-mt-18 py-section">
        <Container size="3xl">
          <div className="investor-glass rounded-2xl p-6 sm:p-10">
            <h2 id="talk-title" className="text-display-sm font-medium text-metal">
              {contact.headline}
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
