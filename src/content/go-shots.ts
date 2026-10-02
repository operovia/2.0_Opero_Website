import type { StaticImageData } from 'next/image';
import home from '@/assets/go/home.png';
import inspection from '@/assets/go/inspection.png';
import leasing from '@/assets/go/leasing.png';
import oppie from '@/assets/go/oppie.png';
import type { GoScreenName } from './constants';

/**
 * The drawn OperoGo screens behind the home page's OperoGo section, rendered
 * by scripts/go-shots into src/assets/go. Imported rather than served from
 * public/, so each picture's address carries a fingerprint of its contents
 * and a re-rendered picture is never hidden behind a cached copy. Drawn at
 * 390 x 844 CSS pixels; the files are three times that.
 */
export const GO_SHOTS: Record<GoScreenName, StaticImageData> = { home, oppie, inspection, leasing };
