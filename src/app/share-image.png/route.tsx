import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { SHARE_IMAGE_SIZE } from '@/content/metadata';
import { getPage, getPublicSettings } from '@/content/store';
import { onOneLine, withoutEmphasis } from '@/lib/headline';
import { tokens } from '@/theme/tokens';

const c = tokens.color.dark;

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

type Assets = { medium: Buffer; semibold: Buffer; logo: { src: string; width: number; height: number } };
let assets: Promise<Assets> | undefined;

/** Fonts and the wordmark, loaded once. Satori reads TTF, so the fonts folder carries TTF copies of two weights. */
function loadAssets(): Promise<Assets> {
  assets ??= (async () => {
    const root = /*turbopackIgnore: true*/ process.cwd();
    const [medium, semibold, logo] = await Promise.all([
      readFile(path.join(root, 'src/theme/fonts/PlusJakartaSans-Medium.ttf')),
      readFile(path.join(root, 'src/theme/fonts/PlusJakartaSans-SemiBold.ttf')),
      sharp(path.join(root, 'public/brand/opero/png/opero-dark.png')).trim().resize({ height: 132 }).png().toBuffer({ resolveWithObject: true }),
    ]);
    return {
      medium,
      semibold,
      logo: { src: `data:image/png;base64,${logo.data.toString('base64')}`, width: logo.info.width, height: logo.info.height },
    };
  })();
  return assets;
}

let cached: { key: string; png: ArrayBuffer } | undefined;

/**
 * The default share image: the wordmark and the hero headline on the dark
 * canvas with the jewel aurora. Used until a share image is chosen in
 * Settings; the page metadata adds ?v=<content version> so it refreshes.
 */
export async function GET() {
  const [{ hero }, { version }, { medium, semibold, logo }] = await Promise.all([getPage('home'), getPublicSettings(), loadAssets()]);
  const headline = onOneLine(withoutEmphasis(hero.headline));
  const key = `${version}:${headline}`;

  if (cached?.key !== key) {
    const [violet, teal, crimson, green, gold] = tokens.brand.aurora.colors;
    const glow = (color: string, x: number, y: number, alpha: number) => `radial-gradient(circle at ${x}% ${y}%, ${rgba(color, alpha)} 0%, ${rgba(color, 0)} 42%)`;
    const image = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '76px 84px',
            backgroundColor: c.canvas,
            backgroundImage: [glow(violet!, 8, 0, 0.55), glow(teal!, 92, 8, 0.45), glow(crimson!, 70, 110, 0.4), glow(green!, 18, 110, 0.3), glow(gold!, 105, 70, 0.3)].join(', '),
            fontFamily: 'Plus Jakarta Sans',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img elements. */}
          <img src={logo.src} width={Math.round(logo.width * (66 / logo.height))} height={66} alt="" />
          <div
            style={{
              display: 'flex',
              maxWidth: 960,
              fontSize: headline.length > 70 ? 58 : 70,
              fontWeight: 500,
              lineHeight: 1.12,
              letterSpacing: '-0.005em',
              color: c.fg,
            }}
          >
            {headline}
          </div>
        </div>
      ),
      {
        ...SHARE_IMAGE_SIZE,
        fonts: [
          { name: 'Plus Jakarta Sans', data: medium, weight: 500, style: 'normal' },
          { name: 'Plus Jakarta Sans', data: semibold, weight: 600, style: 'normal' },
        ],
      },
    );
    cached = { key, png: await image.arrayBuffer() };
  }

  return new Response(cached.png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
