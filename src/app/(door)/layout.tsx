import type { Metadata } from 'next';
import { MotionRoot } from '@/components/motion/motion-root';

/** The door is private: never indexed, never followed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The front door's own frame: no header, footer, demo dialog or skip link,
 * just the dark canvas. It shares the root layout with the site, so the
 * crossing from /welcome to / is a client navigation and the veil in the
 * root layout lives through it. The data-theme here keeps every --o-*
 * variable on the dark set whatever the root ever carries.
 */
export default function DoorLayout({ children }: LayoutProps<'/'>) {
  return (
    <MotionRoot>
      <div data-theme="dark" className="flex min-h-dvh flex-col overflow-x-clip bg-canvas">
        {children}
      </div>
    </MotionRoot>
  );
}
