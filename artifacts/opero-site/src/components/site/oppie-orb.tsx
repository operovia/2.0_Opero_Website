import { brandMark } from '@/brand';
import { cn } from '@/lib/cn';

type Props = {
  size?: 'sm' | 'lg';
  /** Show the listening rings and breathing motion. */
  animated?: boolean;
  className?: string;
};

/**
 * Oppie's orb. Uses the supplied artwork from the brand manifest when it
 * exists; until then, a clearly temporary stand-in in the jewel colors
 * (listed in PLACEHOLDERS.md). Decorative.
 */
export function OppieOrb({ size = 'lg', animated = false, className }: Props) {
  const artwork = brandMark('oppie-orb').dark;
  const sizeClass = size === 'sm' ? 'size-5 [--orb-blur:1.5px]' : 'size-44 sm:size-60';

  if (artwork) {
    return <img src={artwork} alt="" aria-hidden className={cn(sizeClass, 'object-contain', className)} />;
  }

  return (
    <span aria-hidden className={cn('oppie-orb relative inline-block shrink-0', sizeClass, animated && 'oppie-orb-animated', className)}>
      {animated ? (
        <>
          <span className="oppie-orb-ring" />
          <span className="oppie-orb-ring oppie-orb-ring-delayed" />
        </>
      ) : null}
      <span className="oppie-orb-body">
        <span className="oppie-orb-core" />
        <span className="oppie-orb-shade" />
        <span className="oppie-orb-shine" />
      </span>
    </span>
  );
}
