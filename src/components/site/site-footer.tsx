import { BrandMark } from '@/components/brand/brand-mark';
import type { SectionData } from '@/content/registry';
import { Container } from './layout-parts';
import { SiteLink } from './site-link';

/** One short row: the Operovia mark, the contact address, and the links. The company's name and place are in the mark and the privacy notice. */
export function SiteFooter({ content, email }: { content: SectionData<'site', 'footer'>; email: string }) {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <BrandMark name="operovia" className="h-6" />
          <a
            href={`mailto:${email}`}
            className="text-sm text-fg-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg hover:decoration-fg"
          >
            {email}
          </a>
        </div>
        {content.links.length ? (
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {content.links.map((item) => (
                <li key={item.href + item.label}>
                  <SiteLink href={item.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {item.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </Container>
    </footer>
  );
}
