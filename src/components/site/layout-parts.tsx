import type { ComponentProps, ReactNode } from 'react';
import { Reveal } from '@/components/motion/reveal';
import { RichText } from '@/components/rich-text';
import { cn } from '@/lib/cn';
import type { RichDoc } from '@/lib/rich-text';
import { SiteLink } from './site-link';

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-content px-gutter', className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-eyebrow font-semibold text-fg-subtle uppercase', className)}>{children}</p>;
}

/** The eyebrow, headline, and body that open most sections. */
export function SectionIntro({
  eyebrow,
  headline,
  headingId,
  body,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  headline: string;
  /** Lets the section name itself after its headline (aria-labelledby). */
  headingId?: string;
  body?: RichDoc;
  align?: 'left' | 'center';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div className={cn(centered ? 'mx-auto text-center' : '', 'max-w-3xl', className)}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={0.05}>
        <h2 id={headingId} className={cn('text-display-md font-medium text-metal', eyebrow && 'mt-5')}>
          {headline}
        </h2>
      </Reveal>
      {body ? (
        <Reveal delay={0.1}>
          <RichText doc={body} className={cn('mt-7 text-lg text-fg-muted sm:text-xl', centered && 'mx-auto max-w-2xl')} />
        </Reveal>
      ) : null}
    </div>
  );
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,box-shadow,border-color,color] duration-200 focus-visible:outline-offset-4';

const buttonVariants = {
  primary: 'bg-accent text-on-accent shadow-md hover:bg-accent-hover hover:shadow-glow',
  secondary: 'border border-line-strong text-fg hover:border-fg-subtle hover:bg-accent-soft',
};

const buttonSizes = { md: 'h-11 px-6 text-sm', lg: 'h-13 px-8 text-base' };

export function SiteButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
}) {
  return (
    <SiteLink href={href} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}>
      {children}
    </SiteLink>
  );
}
