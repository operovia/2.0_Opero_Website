import type { CSSProperties } from 'react';
import type { ShotSet } from '@/content/shot-set';

type Props = {
  set: ShotSet;
  alt: string;
  /** The width the picture shows at, as the sizes attribute takes it. */
  sizes: string;
  /** Lazy by default: the picture loads as it nears the viewport. Eager fetches it at once, shown or not. */
  loading?: 'eager' | 'lazy';
  className?: string;
  style?: CSSProperties;
  draggable?: boolean;
};

/**
 * A drawn screen from its WebP set: a plain img with srcset and sizes, so
 * the browser fetches the one size it needs straight from the file, and
 * nothing goes through the runtime image optimizer. Width and height are the
 * original's, so the box holds its shape before the picture arrives.
 */
export function ShotImage({ set, alt, sizes, loading = 'lazy', className, style, draggable }: Props) {
  const largest = set.sources.at(-1)?.image ?? set.original;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the set is made ahead of time; next/image would send it through the optimizer.
    <img
      src={largest.src}
      srcSet={set.sources.map((source) => `${source.image.src} ${source.width}w`).join(', ')}
      sizes={sizes}
      width={set.original.width}
      height={set.original.height}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      style={style}
      draggable={draggable}
    />
  );
}
