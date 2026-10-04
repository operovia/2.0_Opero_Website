import home from '@/assets/go/home.png';
import home576 from '@/assets/go/home-576.webp';
import home864 from '@/assets/go/home-864.webp';
import home1170 from '@/assets/go/home-1170.webp';
import inspection from '@/assets/go/inspection.png';
import inspection576 from '@/assets/go/inspection-576.webp';
import inspection864 from '@/assets/go/inspection-864.webp';
import inspection1170 from '@/assets/go/inspection-1170.webp';
import leasing from '@/assets/go/leasing.png';
import leasing576 from '@/assets/go/leasing-576.webp';
import leasing864 from '@/assets/go/leasing-864.webp';
import leasing1170 from '@/assets/go/leasing-1170.webp';
import oppie from '@/assets/go/oppie.png';
import oppie576 from '@/assets/go/oppie-576.webp';
import oppie864 from '@/assets/go/oppie-864.webp';
import oppie1170 from '@/assets/go/oppie-1170.webp';
import type { GoScreenName } from './constants';
import { shotSet, type ShotSet } from './shot-set';

/**
 * The drawn OperoGo screens behind the home page's OperoGo section, rendered
 * by scripts/go-shots into src/assets/go, with the WebP set the site serves
 * each from (scripts/shot-sets.mjs: 576, 864 and 1170 wide, two and three
 * times the width a phone shows at, and the whole screen for the lightbox).
 * Drawn at 390 x 844 CSS pixels; the PNG is three times that.
 */
export const GO_SHOTS: Record<GoScreenName, ShotSet> = {
  home: shotSet(home, home576, home864, home1170),
  oppie: shotSet(oppie, oppie576, oppie864, oppie1170),
  inspection: shotSet(inspection, inspection576, inspection864, inspection1170),
  leasing: shotSet(leasing, leasing576, leasing864, leasing1170),
};
