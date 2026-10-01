// Exports the web and email copies of the Opero lockup with the jewels centered underneath the wordmark.
//
//   node scripts/brand/export-lockup.mjs
//
// The supplied artwork is the pair of 4800 x 2638 PNGs in public/brand/opero/centered (the SVGs that came with
// them were empty wrappers, so the PNGs are the source). This cuts each to the artwork's visible bounds and writes:
//   public/brand/opero/opero-centered-{dark,light}.webp      the mark the site draws (BrandMark "opero"), 1400 px wide
//   public/brand/opero/png/opero-centered-{dark,light}-email-{1x,2x}.png   the email wordmark, 116 px wide at 1x
// It prints the sizes to put in public/brand/manifest.json. The originals are never changed.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = path.join(root, 'public', 'brand', 'opero', 'centered');
const out = path.join(root, 'public', 'brand', 'opero');
/** The visible artwork inside the 4800 x 2638 canvas: the wordmark at (663, 663) 3474 x 808 and the jewels at (1229, 1737) 2342 x 238. */
const BOUNDS = { left: 663, top: 663, width: 3474, height: 1312 };
const WEB_WIDTH = 1200;
const EMAIL_WIDTH = 116;

await mkdir(path.join(out, 'png'), { recursive: true });
for (const tone of ['dark', 'light']) {
  const artwork = sharp(path.join(source, `opero-centered-jewels-${tone}.png`)).extract(BOUNDS);
  const web = await artwork.clone().resize({ width: WEB_WIDTH }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(out, `opero-centered-${tone}.webp`));
  console.log(`opero-centered-${tone}.webp ${web.width}x${web.height} ${Math.round(web.size / 1024)} KB`);
  for (const scale of [1, 2]) {
    const email = await artwork
      .clone()
      .resize({ width: EMAIL_WIDTH * scale })
      .png({ compressionLevel: 9 })
      .toFile(path.join(out, 'png', `opero-centered-${tone}-email-${scale}x.png`));
    console.log(`png/opero-centered-${tone}-email-${scale}x.png ${email.width}x${email.height} ${Math.round(email.size / 1024)} KB`);
  }
}
