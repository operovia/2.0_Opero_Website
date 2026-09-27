import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Container } from '@/components/site/layout-parts';
import { getPage } from '@/content/store';

// Surveys are private to the people asked: never indexed, never followed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** A quiet frame for surveys: the brand, the survey, and a privacy link. No site navigation. */
export default async function SurveyLayout({ children }: { children: ReactNode }) {
  const { footer } = await getPage('site');
  const privacy = footer.links.find((link) => link.href === '/privacy');

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-on-accent"
      >
        Skip to content
      </a>
      <header className="border-b border-line">
        <Container size="2xl" className="flex h-16 items-center">
          <BrandMark name="opero-small" className="h-7" priority />
        </Container>
      </header>
      <main id="main" className="flex-1 py-12 sm:py-16">
        <Container size="2xl">{children}</Container>
      </main>
      <footer className="border-t border-line">
        <Container size="2xl" className="flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-fg-subtle">
          <span>© {footer.companyName}</span>
          {privacy ? (
            // A new tab, so reading it never loses answers in progress.
            <a href="/privacy" target="_blank" className="underline decoration-line-strong underline-offset-4 hover:text-fg">
              {privacy.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </Container>
      </footer>
    </div>
  );
}
