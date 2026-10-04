'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A row that scrolls sideways on phones and lays out as its children ask
 * from sm (the OperoGo features). It is in the tab order only while it
 * actually scrolls, so a keyboard can move it there (the arrow keys scroll
 * a focused row), and a layout that fits has no stop that does nothing.
 * Rows whose items are links need none of this: focusing a link scrolls it
 * into view.
 */
export function SwipeRow({ className, children }: { className?: string; children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const element = row.current;
    if (!element) return;
    const look = () => setScrolls(element.scrollWidth > element.clientWidth);
    look();
    const observer = new ResizeObserver(look);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={row}
      tabIndex={scrolls ? 0 : undefined}
      className={cn(
        'swipe-row snap-x snap-mandatory overflow-x-auto rounded-lg max-sm:-mx-gutter max-sm:px-gutter max-sm:pb-2 sm:overflow-visible',
        'focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
