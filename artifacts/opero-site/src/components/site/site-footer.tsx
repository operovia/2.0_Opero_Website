import { BrandMark } from '@/components/brand/brand-mark';
import type { SectionData } from '@/content/registry';
import { Container } from './layout-parts';
import { SiteLink } from './site-link';

export function SiteFooter({ content, email }: { content: SectionData<'site', 'footer'>; email: string }) {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between">
        <div className="space-y-5">
          <BrandMark name="operovia-small" className="h-6" />
          <address className="text-sm text-fg-muted not-italic">
            <span className="block text-fg">{content.companyName}</span>
            <span className="block">{content.location}</span>
            <a href={`mailto:${email}`} className="mt-2 inline-block underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg hover:decoration-fg">
              {email}
            </a>
          </address>
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
      <Container>
        <p className="border-t border-line py-6 text-xs text-fg-subtle">© {content.companyName}</p>
      </Container>
    </footer>
  );
}
