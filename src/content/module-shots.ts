import type { StaticImageData } from 'next/image';
import build from '@/assets/modules/build.png';
import compass from '@/assets/modules/compass.png';
import playbook from '@/assets/modules/playbook.png';
import studios from '@/assets/modules/studios.png';
import university from '@/assets/modules/university.png';
import type { ModuleName } from './constants';

/**
 * The drawn screen behind each module card, rendered by scripts/module-shots
 * into src/assets/modules. Imported rather than served from public/, so each
 * picture's address carries a fingerprint of its contents: a re-rendered
 * picture gets a new address, and no browser or image cache can keep showing
 * the old one. Drawn at 1440 x 900 CSS pixels; the files are twice that.
 */
export const MODULE_SHOTS: Record<ModuleName, StaticImageData> = { build, studios, playbook, university, compass };

/**
 * The core CRM screen for the tour's Core tab: a property, lease or rent roll
 * screen drawn like the module screens, 2880 x 1800. None exists yet, so the
 * tab stays hidden. Render one to src/assets/modules/core.png, import it here
 * in place of null, and the tab shows, captioned from Content, Home, Platform
 * (Core screenshot caption).
 */
export const CORE_SHOT: StaticImageData | null = null;
