import { cn } from '@/lib/cn';

/**
 * The brand's ambient light: soft glows in the jewel colors that drift very
 * slowly. Pure CSS, animated with transforms only, and still when the
 * visitor prefers reduced motion. Decorative, hidden from assistive tech.
 */
export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn('aurora pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} style={{ opacity: `calc(var(--o-aurora-opacity) * ${intensity})` }}>
      <div className="aurora-glow aurora-glow-1" />
      <div className="aurora-glow aurora-glow-2" />
      <div className="aurora-glow aurora-glow-3" />
      <div className="aurora-glow aurora-glow-4" />
      <div className="aurora-glow aurora-glow-5" />
    </div>
  );
}
