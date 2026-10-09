import type { Metadata } from 'next';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { RichText } from '@/components/rich-text';
import { Aurora } from '@/components/site/aurora';
import { Container, Eyebrow } from '@/components/site/layout-parts';
import { PartnerApplicationForm } from '@/components/site/partner-application-form';
import { openGraph } from '@/content/metadata';
import { getPage } from '@/content/store';
import { cn } from '@/lib/cn';
import { plainHeadline, renderHeadline } from '@/lib/headline';
import { requireEntry } from '@/server/entry';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const { intro } = await getPage('partners');
  const title = plainHeadline(intro.headline).replace(/[.!]$/, '');
  return { title, alternates: { canonical: '/partners' }, openGraph: await openGraph({ title, url: '/partners' }) };
}

const jewels = ['jewel-crimson', 'jewel-violet', 'jewel-gold', 'jewel-green', 'jewel-teal'];

export default async function PartnersPage() {
  await requireEntry();
  await noteVisit('/partners');
  const { intro, gets, asks, selection, apply } = await getPage('partners');
  return (
    <>
      <section aria-labelledby="partners-title" className="relative isolate -mt-18 overflow-hidden pt-18">
        <Aurora intensity={0.85} />
        <Container size="4xl" className="pt-16 pb-16 sm:pt-24 sm:pb-20">
          {intro.eyebrow ? <Eyebrow className="hero-fade">{intro.eyebrow}</Eyebrow> : null}
          <h1 id="partners-title" className="hero-rise mt-5 text-display-lg font-medium text-metal">
            {renderHeadline(intro.headline)}
          </h1>
          <RichText doc={intro.body} className="hero-fade mt-8 max-w-3xl text-lg text-fg-muted sm:text-xl" />
        </Container>
      </section>

      <section aria-labelledby="gets-title" className="py-section">
        <Container size="5xl">
          <Reveal>
            <h2 id="gets-title" className="text-display-sm font-medium text-metal">
              {renderHeadline(gets.headline)}
            </h2>
          </Reveal>
          <RevealGroup as="ul" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {gets.items.map((item, i) => (
              <RevealItem as="li" key={item.title + i} className="rounded-2xl border border-line bg-surface p-7">
                <span aria-hidden className={cn('block size-5 rounded-full shadow-sm', jewels[i % jewels.length])} />
                <h3 className="mt-6 text-xl font-semibold text-fg">{item.title}</h3>
                <p className="mt-2 text-base text-fg-muted">{item.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section aria-labelledby="asks-title" className="border-y border-line bg-canvas-raised py-section">
        <Container size="5xl">
          <Reveal>
            <h2 id="asks-title" className="text-display-sm font-medium text-metal">
              {renderHeadline(asks.headline)}
            </h2>
          </Reveal>
          <RevealGroup as="ol" className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {asks.items.map((item, i) => (
              <RevealItem as="li" key={item.title + i} className="flex gap-5">
                <span aria-hidden className="w-14 shrink-0 text-display-sm font-medium text-fg-subtle tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-fg">{item.title}</h3>
                  <p className="mt-2 text-base text-fg-muted">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section aria-labelledby="selection-title" className="py-section">
        <Container size="3xl" className="text-center">
          <Reveal>
            <h2 id="selection-title" className="text-display-sm font-medium text-metal">
              {renderHeadline(selection.headline)}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <RichText doc={selection.body} className="mt-6 text-lg text-fg-muted sm:text-xl" />
          </Reveal>
        </Container>
      </section>

      <section id="apply" aria-labelledby="apply-title" className="scroll-mt-18 pb-section">
        <Container size="3xl">
          <div className="rounded-2xl border border-line-strong bg-surface p-6 shadow-lg sm:p-10">
            <h2 id="apply-title" className="text-display-sm font-medium text-metal">
              {renderHeadline(apply.headline)}
            </h2>
            <p className="mt-4 text-lg text-fg-muted">{apply.intro}</p>
            <div className="mt-10">
              <PartnerApplicationForm content={apply} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
