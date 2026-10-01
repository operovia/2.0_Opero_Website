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
