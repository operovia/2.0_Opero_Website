import { RichText } from '@/components/rich-text';
import { Container } from '@/components/site/layout-parts';
export default function PrivacyPage({ privacy }: { privacy: any }) {
  const { notice } = privacy;
  return (
    <Container size="3xl" className="py-section">
      <h1 className="text-display-md font-medium text-metal">{notice.headline}</h1>
      <RichText doc={notice.intro} className="mt-8 text-lg text-fg-muted sm:text-xl" />
      <div className="mt-14 space-y-12">
        {notice.sections.map((section: any, i: number) => (
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
