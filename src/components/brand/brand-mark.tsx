import { preload } from 'react-dom';
import { brandMark, type Box, type MarkName } from '@/brand';
import { cn } from '@/lib/cn';

type Tone = 'dark' | 'light';

type Props = {
  name: MarkName;
  /**
   * The background the mark sits on. `auto` renders both versions and lets
   * the surrounding theme pick (used in the admin, which follows the OS).
   */
  on?: Tone | 'auto';
  /** Size with a height class, e.g. `h-7`; width follows the artwork. */
  className?: string;
  /** Hide from assistive tech when a surrounding label already names it. */
  decorative?: boolean;
  /** Keep the file's built-in clear space instead of trimming to the artwork. */
  untrimmed?: boolean;
  /** Fetch the file early and first: for a mark at the top of the page, which is often the largest thing painted first. */
  priority?: boolean;
};

/**
 * Renders a brand mark from public/brand/manifest.json. The file is placed
 * inside an SVG whose viewBox is the mark's visible bounds, which trims built-in
 * clear space without editing the artwork.
 */
export function BrandMark({ name, on = 'dark', className, decorative, untrimmed, priority }: Props) {
  if (on === 'auto') {
    return (
      <>
        <BrandMark name={name} on="dark" className={cn('brand-on-dark', className)} decorative={decorative} untrimmed={untrimmed} />
        <BrandMark name={name} on="light" className={cn('brand-on-light', className)} decorative={decorative} untrimmed={untrimmed} />
      </>
    );
  }

  const mark = brandMark(name);
  const src = mark[on];
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': mark.label };

  if (!src) {
    return (
      <span className={cn('inline-flex items-center font-display font-semibold', className)} {...a11y}>
        {mark.label}
      </span>
    );
  }

  // Inside an svg, the image is only found once styles load; a preload lets the browser start at once.
  if (priority) preload(src, { as: 'image', fetchPriority: 'high' });

  const box: Box = untrimmed ? mark.viewBox : mark.bounds;
  const [x, y, width, height] = mark.viewBox;

  return (
    <svg
      viewBox={box.join(' ')}
      className={cn('w-auto shrink-0', className)}
      style={{ aspectRatio: `${box[2]} / ${box[3]}` }}
      focusable="false"
      {...a11y}
    >
      <image href={src} x={x} y={y} width={width} height={height} />
    </svg>
  );
}
