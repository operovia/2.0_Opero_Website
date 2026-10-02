import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  /** The screen: a picture that fills it. */
  children: ReactNode;
  className?: string;
  /** Props for the screen itself, which the lightbox zooms: its ref, its pointer handlers, its cursor. */
  screen?: ComponentProps<'div'>;
};

/**
 * An iPhone drawn around one of the OperoGo screens, on the page and in its
 * lightbox: the band in the wordmark's metal, with the Action button and the
 * volume buttons on its left side and the side button on its right; the
 * black glass; the screen, with the display's rounded corners; and the
 * Dynamic Island over the top of the screen, where the drawn screens leave
 * room for it in their status bar (scripts/go-shots). Every size is a share
 * of the phone's width (globals.css, .phone), so it keeps an iPhone's
 * proportions at any size.
 */
export function PhoneFrame({ children, className, screen }: Props) {
  return (
    <div className={cn('phone', className)}>
      <span className="phone-key phone-key-action" aria-hidden />
      <span className="phone-key phone-key-up" aria-hidden />
      <span className="phone-key phone-key-down" aria-hidden />
      <span className="phone-key phone-key-side" aria-hidden />
      <div className="phone-body">
        <div className="phone-glass">
          <div {...screen} className={cn('phone-screen', screen?.className)}>
            {children}
            <span className="phone-island" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
