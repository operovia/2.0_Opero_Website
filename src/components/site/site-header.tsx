'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { DATA_ROOM_PATH } from '@/content/constants';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { Container, SiteButton } from './layout-parts';
import { SiteLink } from './site-link';

type Props = { content: SectionData<'site', 'header'> };

export function SiteHeader({ content }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu is open only on the page where it was opened, so navigating closes it.
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const open = menuOn === pathname;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300',
        scrolled || open ? 'border-line bg-canvas/80 backdrop-blur-xl' : 'border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-18 items-center justify-between gap-3 sm:gap-6">
        {/* data-door-mark: the front door's veil lands its traveling mark on this one (src/components/door/door-veil.tsx). */}
        <Link href="/" aria-label="Opero home" className="rounded-sm" data-door-mark>
          <BrandMark name="opero" className="h-9 sm:h-11 lg:h-13" decorative priority />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          {/* Five links: a tighter gap and no wrapping until lg, where there is room for the full gap. */}
          <ul className="flex items-center gap-4 lg:gap-8">
            {content.links.map((item) => (
              <li key={item.href + item.label}>
                <SiteLink href={item.href} className="text-sm font-medium whitespace-nowrap text-fg-muted transition-colors hover:text-fg">
                  {item.label}
                </SiteLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Investors in the Data Room are not asked to book a demo. */}
          {pathname.startsWith(DATA_ROOM_PATH) ? null : <SiteButton href={content.buttonTarget}>{content.buttonLabel}</SiteButton>}
          {content.links.length ? (
            <button
              type="button"
              onClick={() => setMenuOn(open ? null : pathname)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="inline-flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg md:hidden"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            </button>
          ) : null}
        </div>
      </Container>

      {open ? (
        <div id="site-menu" className="border-t border-line md:hidden">
          <Container className="py-4">
            <ul className="space-y-1">
              {content.links.map((item) => (
                <li key={item.href + item.label}>
                  <SiteLink href={item.href} className="flex h-12 items-center rounded-lg px-3 text-base font-medium text-fg hover:bg-accent-soft">
                    {item.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
