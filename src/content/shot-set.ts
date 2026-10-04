import type { StaticImageData } from 'next/image';

/**
 * A drawn screen and the files the site serves for it (scripts/shot-sets.mjs):
 * the original PNG, for its size and as the link without JavaScript, and the
 * WebP set, smallest first, one of which the browser picks by the width it
 * needs. All static imports, so every address carries a fingerprint of the
 * file's contents and is cached for good.
 */
export type ShotSet = { original: StaticImageData; sources: { width: number; image: StaticImageData }[] };

/** A set from its original and its WebP files, in any order. */
export const shotSet = (original: StaticImageData, ...images: StaticImageData[]): ShotSet => ({
  original,
  sources: images.map((image) => ({ width: image.width, image })).sort((a, b) => a.width - b.width),
});
