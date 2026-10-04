#!/usr/bin/env node
/**
 * The WebP sets of the drawn screens: each module screenshot
 * (src/assets/modules/<module>.png, 2880 x 1800) at 1280, 1920 and 2880
 * wide, and each OperoGo screen (src/assets/go/<screen>.png, 1170 x 2532)
 * at 576, 864 and 1170 wide, as <name>-<width>.webp beside the PNG. The
 * site imports these files (src/content/module-shots.ts, go-shots.ts) and
 * serves them as they are, with srcset and sizes, so no screenshot goes
 * through the runtime image optimizer and each file's address carries a
 * fingerprint of its contents. The render scripts run this after drawing;
 * run it by itself after changing a PNG some other way:
 *
 *   node scripts/shot-sets.mjs [modules|go] [name ...]
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

export const SETS = {
  modules: { dir: 'src/assets/modules', names: ['build', 'studios', 'playbook', 'university', 'compass'], widths: [1280, 1920, 2880] },
  go: { dir: 'src/assets/go', names: ['home', 'oppie', 'inspection', 'leasing'], widths: [576, 864, 1170] },
};

/** Writes the set for the named screens of one kind (all of them when `names` is empty). */
export async function makeSets(kind, names = []) {
  const set = SETS[kind];
  if (!set) throw new Error(`Unknown kind: ${kind}`);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const name of names.length ? names : set.names) {
    const source = path.join(root, set.dir, `${name}.png`);
    for (const width of set.widths) {
      const out = path.join(root, set.dir, `${name}-${width}.webp`);
      // Text-heavy screens: a high quality and full chroma keep small type crisp.
      await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 84, effort: 6, smartSubsample: false }).toFile(out);
      console.log(path.relative(root, out));
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, ...names] = process.argv.slice(2);
  for (const k of kind ? [kind] : Object.keys(SETS)) await makeSets(k, names);
}
