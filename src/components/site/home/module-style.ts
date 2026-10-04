import type { ModuleName } from '@/content/constants';

/** Each module's jewel, the disc on its card and the dot on its tour tab (jewel-* utilities, built from the logo's jewels). */
export const moduleJewel: Record<ModuleName, string> = {
  build: 'jewel-build',
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
};

/** The soft glow each module's card gives off, in its jewel's color (globals.css). */
export const moduleGlow: Record<ModuleName, string> = {
  build: 'module-glow-build',
  studios: 'module-glow-studios',
  playbook: 'module-glow-playbook',
  university: 'module-glow-university',
  compass: 'module-glow-compass',
};
