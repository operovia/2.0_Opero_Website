import manifest from '../../public/brand/manifest.json';

/**
 * Typed access to public/brand/manifest.json. Components ask for brand marks
 * by name through this module and never reference artwork files directly.
 */

export type Box = readonly [x: number, y: number, width: number, height: number];

export type BrandMark = {
  label: string;
  /** File drawn for dark backgrounds, or null while the artwork is pending. */
  dark: string | null;
  /** File drawn for light backgrounds, or null while the artwork is pending. */
  light: string | null;
  viewBox: Box;
  bounds: Box;
  /**
   * The file holds nothing past the bounds but the artwork's own soft edge, which may show past them: the mark keeps the
   * size of its bounds, and the edge is not cut flat. Marks whose files carry other artwork past their bounds leave it off.
   */
  bleed?: boolean;
};

export type MarkName = keyof typeof manifest.marks;

const marks = manifest.marks as unknown as Record<MarkName, BrandMark>;

export function brandMark(name: MarkName): BrandMark {
  return marks[name];
}

export const favicon = manifest.favicon;

export const emailWordmark = manifest.email.opero;

export type ModuleMarkName = Extract<MarkName, `module-${string}`>;
