'use client';

import { useLayoutEffect } from 'react';
import { arrived, endArrival, getSnapshot } from './door-store';

/**
 * Copies each glow's phase from the veil's aurora to the hero's, so the two
 * fields drift as one while the darkness lifts. Reading the animations here,
 * before anything else has measured the page, creates the hero's with their
 * timing still at zero.
 */
function syncAuroraPhase(): void {
  try {
    const veilGlows = document.querySelectorAll('[data-door-veil] .aurora-glow');
    const heroGlows = document.querySelectorAll('[data-door-hero] .aurora-glow');
    veilGlows.forEach((glow, i) => {
      const twin = heroGlows[i];
      if (!twin) return;
      const [source] = glow.getAnimations();
      const [target] = twin.getAnimations();
      if (source && target && source.currentTime !== null) target.currentTime = source.currentTime;
    });
  } catch {
    // Without getAnimations the two auroras differ by one phase step, hidden under the lift.
  }
}

/** A real leave, as opposed to React's rehearsal of one in development (Strict Mode unmounts and remounts once). */
let leaving: ReturnType<typeof setTimeout> | null = null;

/**
 * The home page's side of the arrival from the front door. Rendered inside
 * the hero (src/components/site/home/hero.tsx), it runs after the home page
 * has committed and before it paints: if a crossing is under way it puts the
 * two auroras in phase and tells the veil the hero is here; on an ordinary
 * visit it clears any hold left on the page so the hero can never stay
 * frozen. When the hero unmounts it takes the hold away with it.
 */
export function DoorArrival() {
  useLayoutEffect(() => {
    if (leaving) {
      clearTimeout(leaving);
      leaving = null;
    }
    const html = document.documentElement;
    if (getSnapshot().phase === 'opening') {
      syncAuroraPhase();
      arrived();
    } else {
      delete html.dataset.doorArrival;
    }
    return () => {
      leaving = setTimeout(() => {
        leaving = null;
        delete html.dataset.doorArrival;
        endArrival();
      }, 0);
    };
  }, []);
  return null;
}
