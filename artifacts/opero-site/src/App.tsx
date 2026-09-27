import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { themeCss } from '@/theme/css';
import { MotionRoot } from '@/components/motion/motion-root';
import { DemoDialog } from '@/components/site/demo-dialog';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { MaintenancePage } from '@/components/site/maintenance-page';
import { BrandMark } from '@/components/brand/brand-mark';
import { Container } from '@/components/site/layout-parts';
import { RichText } from '@/components/rich-text';
import HomePage from '@/app/(site)/page';
import PartnersPage from '@/app/(site)/partners/page';
import PrivacyPage from '@/app/(site)/privacy/page';
import { SurveyForm } from '@/app/s/[slug]/survey-form';
import { api } from '@/lib/opero-api';
import { Admin } from '@/pages/admin-client';
import { AcceptInvite } from '@/pages/admin-extras';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });
const css = document.createElement('style');
css.id = 'design-tokens';
css.textContent = themeCss();
document.head.append(css);
document.documentElement.dataset.theme = 'dark';

function Metadata({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = title;
    if (description) {
      const tag = document.querySelector('meta[name="description"]');
      tag?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }, [title, description]);
  return null;
}

function Loading() {
  return <div className="mx-auto max-w-5xl animate-pulse space-y-8 px-gutter py-24" aria-label="Loading content">
    <div className="h-4 w-28 rounded bg-surface-raised" /><div className="h-16 w-3/4 rounded bg-surface-raised" />
    <div className="h-6 w-1/2 rounded bg-surface-raised" /><div className="mt-16 h-64 rounded-2xl bg-surface-raised" />
  </div>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return <div className="mx-auto max-w-2xl px-gutter py-32 text-center"><h1 className="text-display-sm text-metal">We couldn't load this page.</h1><p className="mt-4 text-fg-muted">Please try again in a moment.</p><button className="mt-8 rounded-full bg-accent px-6 py-3 font-semibold text-on-accent" onClick={retry}>Try again</button></div>;
}

type SiteData = { home: any; site: any; partners: any; privacy: any; scenes: any[]; settings: any };

function Public({ page }: { page: 'home' | 'partners' | 'privacy' }) {
  const query = useQuery<SiteData>({ queryKey: ['opero-site'], queryFn: () => api('/site') });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  const { home, site, partners, privacy, scenes, settings } = query.data;
  const title = page === 'home' ? settings.homeMetaTitle || 'Opero' : `${page === 'partners' ? partners.intro.headline.replace(/[.!]$/, '') : privacy.notice.headline} | ${settings.siteName || 'Opero'}`;
  return <MotionRoot>
    <Metadata title={title} description={settings.homeMetaDescription} />
    {settings.maintenanceMode ? <MaintenancePage content={site.maintenance} /> : <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-on-accent">Skip to content</a>
      <SiteHeader content={site.header} />
      <main id="main" tabIndex={-1} className="outline-none">
        {page === 'home' ? <HomePage home={home} scenes={scenes || []} /> : page === 'partners' ? <PartnersPage partners={partners} /> : <PrivacyPage privacy={privacy} />}
      </main>
      <SiteFooter content={site.footer} email={settings.contactEmail} />
      <DemoDialog content={site.demoForm} />
    </>}
  </MotionRoot>;
}

function Survey({ slug }: { slug: string }) {
  const token = new URLSearchParams(window.location.search).get('t');
  const preview = new URLSearchParams(window.location.search).get('preview') === '1';
  const query = useQuery<any>({ queryKey: ['opero-survey', slug, token, preview], queryFn: () => api(`/surveys/${encodeURIComponent(slug)}?${new URLSearchParams({ ...(token ? { token } : {}), ...(preview ? { preview: '1' } : {}) })}`) });
  const site = useQuery<SiteData>({ queryKey: ['opero-site'], queryFn: () => api('/site') });
  if (query.isPending || site.isPending) return <Loading />;
  if (query.isError || site.isError) return <ErrorState retry={() => { query.refetch(); site.refetch(); }} />;
  const view = query.data;
  const survey = view.survey || view;
  const title = survey.title || 'Survey';
  const messages: Record<string, string> = {
    closed: 'This survey has closed and is no longer taking responses. Thank you for your interest.',
    'invite-only': 'Please use the personal link from your invitation email.',
    'bad-link': 'Check that you used the whole link from your invitation email.',
    done: 'You have already responded.',
  };
  return <>
    <Metadata title={`${title} | Opero`} />
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line"><Container size="2xl" className="flex h-16 items-center"><BrandMark name="opero-small" className="h-7" /></Container></header>
      <main id="main" className="flex-1 py-12 sm:py-16"><Container size="2xl">
        {view.kind && view.kind !== 'form' ? <div className="space-y-4 py-8"><h1 className="text-display-sm font-medium text-metal">{title}</h1><p className="text-lg text-fg-muted">{messages[view.kind] || 'This survey is unavailable.'}</p></div> :
          <SurveyForm surveyId={survey.id} token={view.token || token} preview={Boolean(view.preview || preview)} title={title} intro={survey.intro?.content ? <RichText doc={survey.intro} className="text-lg text-fg-muted" /> : null} thankYou={survey.thankYou?.content ? <RichText doc={survey.thankYou} className="text-lg text-fg-muted" /> : null} questions={view.questions || survey.questions || []} />}
      </Container></main>
      <footer className="border-t border-line"><Container size="2xl" className="flex justify-between gap-3 py-6 text-xs text-fg-subtle"><span>© {site.data.site.footer.companyName}</span><a href="/privacy" target="_blank" className="underline">Privacy</a></Container></footer>
    </div>
  </>;
}

function NotFound() {
  return <><Metadata title="Page not found | Opero" /><div className="flex min-h-dvh flex-col items-center justify-center px-gutter text-center"><BrandMark name="opero-small" className="h-10" /><h1 className="mt-12 text-display-sm text-metal">Page not found.</h1><a href="/" className="mt-8 rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Back to Opero</a></div></>;
}

function Routed({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return <>{children}</>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routed><Switch>
        <Route path="/"><Public page="home" /></Route>
        <Route path="/partners"><Public page="partners" /></Route>
        <Route path="/privacy"><Public page="privacy" /></Route>
        <Route path="/s/:slug">{(params) => <Survey slug={params.slug} />}</Route>
        <Route path="/admin/accept-invite"><AcceptInvite /></Route>
        <Route path="/admin/:rest*"><Admin /></Route>
        <Route path="/admin"><Admin /></Route>
        <Route><NotFound /></Route>
      </Switch></Routed>
    </WouterRouter>
  </QueryClientProvider>;
}

export default App;