import type { Metadata } from 'next';
import { RichText } from '@/components/rich-text';
import { Container } from '@/components/site/layout-parts';
import { openGraph } from '@/content/metadata';
import { getPage } from '@/content/store';
import { plainHeadline, renderHeadline } from '@/lib/headline';
import { noteVisit } from '@/server/visits';

export async function generateMetadata(): Promise<Metadata> {
  const { notice } = await getPage('privacy');
  const title = plainHeadline(notice.headline);
  return { title, alternates: { canonical: '/privacy' }, openGraph: await openGraph({ title, url: '/privacy' }) };
}

/** The privacy notice, open to everyone: a visitor without a key may read what the site does with what they give it. */
export default async function PrivacyPage() {
  await noteVisit('/privacy');
  const { notice } = await getPage('privacy');
  return (
    <Container size="3xl" className="py-section">
      <h1 className="text-display-md font-medium text-metal">{renderHeadline(notice.headline)}</h1>
      <RichText doc={notice.intro} className="mt-8 text-lg text-fg-muted sm:text-xl" />
      <div className="mt-14 space-y-12">
        {notice.sections.map((section, i) => (
          <section key={section.heading + i} aria-labelledby={`privacy-${i}`}>
            <h2 id={`privacy-${i}`} className="text-2xl font-semibold text-fg">
              {section.heading}
            </h2>
            <RichText doc={section.body} className="mt-4 text-lg text-fg-muted" />
          </section>
        ))}
      </div>
    </Container>
  );
}
