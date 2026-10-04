import build from '@/assets/modules/build.png';
import build1280 from '@/assets/modules/build-1280.webp';
import build1920 from '@/assets/modules/build-1920.webp';
import build2880 from '@/assets/modules/build-2880.webp';
import compass from '@/assets/modules/compass.png';
import compass1280 from '@/assets/modules/compass-1280.webp';
import compass1920 from '@/assets/modules/compass-1920.webp';
import compass2880 from '@/assets/modules/compass-2880.webp';
import playbook from '@/assets/modules/playbook.png';
import playbook1280 from '@/assets/modules/playbook-1280.webp';
import playbook1920 from '@/assets/modules/playbook-1920.webp';
import playbook2880 from '@/assets/modules/playbook-2880.webp';
import studios from '@/assets/modules/studios.png';
import studios1280 from '@/assets/modules/studios-1280.webp';
import studios1920 from '@/assets/modules/studios-1920.webp';
import studios2880 from '@/assets/modules/studios-2880.webp';
import university from '@/assets/modules/university.png';
import university1280 from '@/assets/modules/university-1280.webp';
import university1920 from '@/assets/modules/university-1920.webp';
import university2880 from '@/assets/modules/university-2880.webp';
import type { ModuleName } from './constants';
import { shotSet, type ShotSet } from './shot-set';

/**
 * The drawn screen behind each module's tab in the tour, rendered by
 * scripts/module-shots into src/assets/modules, with the WebP set the site
 * serves it from (scripts/shot-sets.mjs: 1280, 1920 and 2880 wide). Drawn
 * at 1440 x 900 CSS pixels; the PNG is twice that.
 */
export const MODULE_SHOTS: Record<ModuleName, ShotSet> = {
  build: shotSet(build, build1280, build1920, build2880),
  studios: shotSet(studios, studios1280, studios1920, studios2880),
  playbook: shotSet(playbook, playbook1280, playbook1920, playbook2880),
  university: shotSet(university, university1280, university1920, university2880),
  compass: shotSet(compass, compass1280, compass1920, compass2880),
};

/**
 * The core CRM screen for the tour's Core tab: a property, lease or rent roll
 * screen drawn like the module screens, 2880 x 1800. None exists yet, so the
 * tab stays hidden. Render one to src/assets/modules/core.png, make its set
 * (node scripts/shot-sets.mjs), import the files and put shotSet(...) here
 * in place of null, and the tab shows, captioned from Content, Home,
 * Platform (Core screenshot caption).
 */
export const CORE_SHOT: ShotSet | null = null;
