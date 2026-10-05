// Exports the web and email copies of the Opero lockup with the jewels centered underneath the wordmark.
//
//   node scripts/brand/export-lockup.mjs
//
// The supplied artwork is the pair of 4800 x 2638 PNGs in public/brand/opero/centered (the SVGs that came with
// them are empty wrappers, two image tags pointing at no file, so the PNGs are the source). This cuts each to the artwork's visible bounds and writes:
//   public/brand/opero/opero-centered-{dark,light}.webp      the mark the site draws (BrandMark "opero"): the artwork 1200 px wide, inside a
//                                                            transparent margin, so the soft outer edges of the letters survive when the
//                                                            browser shrinks it (cut flush, the tops of the letters and the outer sides of
//                                                            the two o's came out flat)
//   public/brand/opero/png/opero-centered-{dark,light}-email-{1x,2x}.png   the email wordmark, 116 px wide at 1x
// It prints the viewBox (the whole file) and bounds (the artwork inside it) to put in public/brand/manifest.json. The originals are never changed.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = path.join(root, 'public', 'brand', 'opero', 'centered');
const out = path.join(root, 'public', 'brand', 'opero');
/** The visible artwork inside the 4800 x 2638 canvas: the wordmark at (663, 663) 3474 x 808 and the jewels at (1017, 1683) 2767 x 207. */
const BOUNDS = { left: 663, top: 663, width: 3474, height: 1227 };
const WEB_WIDTH = 1200;
/** The transparent margin kept around the artwork in the web copies, in pixels of the original: about 20 px of the web copy. */
const MARGIN = 58;
const EMAIL_WIDTH = 116;

await mkdir(path.join(out, 'png'), { recursive: true });
for (const tone of ['dark', 'light']) {
  const artwork = sharp(path.join(source, `opero-centered-jewels-${tone}.png`)).extract(BOUNDS);
  // The margin comes from the original's own transparent canvas, so the resize sees the letters' real edges rather than a cut.
  const padded = { left: BOUNDS.left - MARGIN, top: BOUNDS.top - MARGIN, width: BOUNDS.width + 2 * MARGIN, height: BOUNDS.height + 2 * MARGIN };
  const width = Math.round((padded.width * WEB_WIDTH) / BOUNDS.width);
  const web = await sharp(path.join(source, `opero-centered-jewels-${tone}.png`))
    .extract(padded)
    .resize({ width })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(path.join(out, `opero-centered-${tone}.webp`));
  const sx = web.width / padded.width;
  const sy = web.height / padded.height;
  const round = (n) => Math.round(n * 100) / 100;
  console.log(`opero-centered-${tone}.webp ${web.width}x${web.height} ${Math.round(web.size / 1024)} KB`);
  console.log(`  viewBox [0, 0, ${web.width}, ${web.height}], bounds [${round(MARGIN * sx)}, ${round(MARGIN * sy)}, ${round(BOUNDS.width * sx)}, ${round(BOUNDS.height * sy)}]`);
  for (const scale of [1, 2]) {
    const email = await artwork
      .clone()
      .resize({ width: EMAIL_WIDTH * scale })
      .png({ compressionLevel: 9 })
      .toFile(path.join(out, 'png', `opero-centered-${tone}-email-${scale}x.png`));
    console.log(`png/opero-centered-${tone}-email-${scale}x.png ${email.width}x${email.height} ${Math.round(email.size / 1024)} KB`);
  }
}
