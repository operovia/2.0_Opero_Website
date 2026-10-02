import { cn } from '@/lib/cn';

/**
 * The red carpet a guest's personal link rolls out: a runner in the crimson
 * jewel, lit along its top edge in gold, that unrolls from the left with the
 * roll riding its leading edge. It is drawn in CSS (.carpet in globals.css)
 * and plays without JavaScript; the caller sets when and how fast through
 * --carpet-delay and --carpet-duration (the door's .door-carpet and the
 * home page's .hero-carpet). Purely decorative.
 */
export function Carpet({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('carpet', className)}>
      <span className="carpet-track">
        <span className="carpet-runner" />
      </span>
      <span className="carpet-roll" />
    </span>
  );
}
