import Link from 'next/link';
import type { ReactNode } from 'react';
import { DEMO_TARGET } from '@/content/registry';

type Props = { href: string; className?: string; children: ReactNode; 'aria-label'?: string };

/**
 * A content-driven link: paths on this site use client navigation, other
 * sites open in a new tab, and #book-demo opens the demo request form.
 */
export function SiteLink({ href, className, children, ...rest }: Props) {
  if (href === DEMO_TARGET) {
    return (
      <a href={DEMO_TARGET} data-demo-trigger className={className} {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//i.test(href);
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  );
}
