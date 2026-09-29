'use client';

import { animate, type AnimationPlaybackControls } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Aurora } from '@/components/site/aurora';
import { Container } from '@/components/site/layout-parts';
import { DOOR_PATH } from '@/content/constants';
import { tokens } from '@/theme/tokens';
import { endArrival, getSnapshot, useDoorState, type DoorPoint, type DoorRect } from './door-store';

const { duration, ease, door } = tokens.motion;
const seconds = (ms: number) => ms / 1000;
/** The spark has flared out by then; the darkness never lifts before it. */
const FLARE_DONE_MS = duration.fast + door.flare;
const HOME = '/';

/**
 * The veil: what carries a guest from the front door to the home page.
 * Rendered once in the root layout (src/app/layout.tsx), above every route,
 * so it lives through the swap from /welcome to /. It renders nothing until
 * the door has dissolved (src/components/door/door.tsx calls beginArrival);
 * then, in one commit, it covers the page with the same dark canvas and its
 * own copy of the mark at the exact spot the door's mark held, and plays:
 * the spark returns where the caret was and flares, a ring of light opens
 * out while the aurora blooms from the spark, and once the home page has
 * mounted beneath it (src/components/door/door-arrival.tsx) the darkness
 * lifts, the mark travels up into the header's own, and the hero is released
 * halfway through the lift. All of it is imperative animate() from Motion,
 * which needs no LazyMotion and is not touched by MotionConfig, so it reads
 * prefers-reduced-motion itself and plays a fade-only timeline for it.
 */
export function DoorVeil() {
  const state = useDoorState();
  const pathname = usePathname();
  if (state.phase !== 'opening' || !state.markRect || !state.point) return null;
  return (
    <Crossing markRect={state.markRect} point={state.point} reduced={state.reduced} arrived={state.arrived} pushedAt={state.pushedAt} pathname={pathname} />
  );
}

type Props = { markRect: DoorRect; point: DoorPoint; reduced: boolean; arrived: boolean; pushedAt: number; pathname: string };

function Crossing({ markRect, point, reduced, arrived, pushedAt, pathname }: Props) {
  const dark = useRef<HTMLDivElement>(null);
  const aurora = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLDivElement>(null);
  const spark = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);

  const alive = useRef(false);
  const startedAt = useRef(0);
  const lifting = useRef(false);
  const liftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<AnimationPlaybackControls[]>([]);
  /** How far the bloom and the lift have come; the veil's aurora shows their product, so the two never fight over its opacity. */
  const bloom = useRef(0);
  const lift = useRef(1);
  const currentPath = useRef(pathname);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  // V0: the veil is on. The spark, the ring of light and the bloom.
  useEffect(() => {
    alive.current = true;
    startedAt.current = performance.now();
    const darkEl = dark.current;
    const auroraEl = aurora.current;
    const irisEl = iris.current;
    const sparkEl = spark.current;
    const paint = () => {
      if (darkEl) darkEl.style.opacity = String(lift.current);
      if (auroraEl) auroraEl.style.opacity = String(bloom.current * lift.current);
    };
    const setBloom = (value: number) => {
      bloom.current = value;
      paint();
    };
    const play = (controls: AnimationPlaybackControls) => running.current.push(controls);

    if (auroraEl && irisEl && sparkEl) {
      if (reduced) {
        play(animate(0, 1, { duration: seconds(duration.reveal), ease: ease.out, onUpdate: setBloom }));
      } else {
        play(
          animate([
            [sparkEl, { opacity: [0, 1], scale: [door.sparkScale, 1] }, { duration: seconds(duration.fast), ease: ease.out }],
            [sparkEl, { opacity: 0, scale: door.flareScale }, { duration: seconds(door.flare), ease: ease.out }],
            [
              irisEl,
              { opacity: [door.irisOpacity, 0], scale: [door.irisFrom, door.irisScale] },
              { duration: seconds(door.iris), ease: ease.out, at: seconds(duration.fast) },
            ],
            [auroraEl, { scale: [door.bloomScale, 1] }, { duration: seconds(door.iris), ease: ease.out, at: seconds(duration.fast) }],
          ]),
        );
        play(animate(0, 1, { duration: seconds(door.iris), ease: ease.out, delay: seconds(duration.fast), onUpdate: setBloom }));
      }
    }

    // If the home page never commits, a plain navigation finishes the job: the cookie is set, so the plain load succeeds.
    const giveUp = setTimeout(
      () => {
        if (currentPath.current !== DOOR_PATH) return;
        delete document.documentElement.dataset.doorArrival;
        // A plain load on purpose: the router's push is what failed to commit.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(HOME);
      },
      Math.max(0, pushedAt + door.giveUp - Date.now()),
    );

    return () => {
      alive.current = false;
      clearTimeout(giveUp);
      if (liftTimer.current) clearTimeout(liftTimer.current);
      for (const controls of running.current) controls.stop();
      running.current = [];
      if (irisEl) irisEl.style.willChange = 'auto';
      // In development React rehearses an unmount and mounts again at once; only a real leave clears the store.
      setTimeout(() => {
        if (!alive.current) endArrival();
      }, 0);
    };
  }, [reduced, pushedAt]);

  // T: the home page has mounted (or the route has changed under a page with no hero). The darkness lifts.
  useEffect(() => {
    if (lifting.current || !(arrived || pathname === HOME)) return;
    lifting.current = true;

    const liftNow = () => {
      const darkEl = dark.current;
      const auroraEl = aurora.current;
      const irisEl = iris.current;
      const markEl = mark.current;
      if (!alive.current || !darkEl || !auroraEl || !markEl) return;
      const html = document.documentElement;
      const play = (controls: AnimationPlaybackControls) => running.current.push(controls);

      let released = false;
      const release = () => {
        released = true;
        if (html.dataset.doorArrival === 'held' && getSnapshot().arrived) html.dataset.doorArrival = 'rising';
        else delete html.dataset.doorArrival;
      };
      // With no hero on the page there is nothing to hold.
      if (!getSnapshot().arrived) release();

      // The mark travels onto the header's own, measured once the page has committed.
      requestAnimationFrame(() => {
        if (!alive.current) return;
        const header = document.querySelector('[data-door-mark] svg')?.getBoundingClientRect();
        const ghostMark = ghost.current?.querySelector('svg')?.getBoundingClientRect();
        const target = header && header.width > 0 ? header : ghostMark && ghostMark.width > 0 ? ghostMark : null;
        if (reduced || !target) {
          play(animate(markEl, { opacity: 0 }, { duration: seconds(duration.slow), ease: ease.standard }));
          return;
        }
        const travel = animate(
          markEl,
          { x: target.left - markRect.left, y: target.top - markRect.top, scale: target.width / markRect.width },
          { duration: seconds(duration.reveal), ease: ease.out },
        );
        play(travel);
        travel.finished.then(() => {
          if (alive.current) play(animate(markEl, { opacity: 0 }, { duration: seconds(duration.fast), ease: ease.out }));
        });
      });

      play(
        animate(1, 0, {
          duration: seconds(door.veil),
          ease: ease.standard,
          onUpdate: (value) => {
            lift.current = value;
            darkEl.style.opacity = String(value);
            auroraEl.style.opacity = String(bloom.current * value);
            if (!released && value <= door.release) release();
          },
          onComplete: () => {
            if (!alive.current) return;
            if (!released) release();
            if (irisEl) irisEl.style.willChange = 'auto';
            document.getElementById('main')?.focus({ preventScroll: true });
            endArrival();
          },
        }),
      );
    };

    liftTimer.current = setTimeout(liftNow, Math.max(0, startedAt.current + FLARE_DONE_MS - performance.now()));
  }, [arrived, pathname, reduced, markRect]);

  // bg-transparent: the base rule paints every data-theme element in canvas; the darkness must be the dark layer alone, so the lift can show the page.
  return (
    <div data-door-veil data-theme="dark" inert aria-hidden className="pointer-events-none fixed inset-0 z-50 bg-transparent">
      <div ref={dark} className="absolute inset-0 bg-canvas" />
      <div ref={aurora} className="fixed inset-x-0 top-0 isolate h-dvh overflow-hidden opacity-0" style={{ transformOrigin: `${point.x}px ${point.y}px` }}>
        <Aurora />
      </div>
      <div ref={iris} className="door-iris absolute opacity-0" style={{ left: `calc(${point.x}px - 12vmin)`, top: `calc(${point.y}px - 12vmin)` }} />
      <div ref={spark} className="door-point size-1.5 opacity-0" style={{ left: point.x, top: point.y, translate: '-50% -50%' }} />
      <div
        ref={mark}
        className="fixed"
        style={{ top: markRect.top, left: markRect.left, width: markRect.width, height: markRect.height, transformOrigin: 'top left' }}
      >
        <BrandMark name="opero" className="h-full" decorative />
      </div>
      {/* The header as the home page draws it: where the mark lands if the real header cannot be measured. */}
      <div ref={ghost} className="invisible absolute inset-x-0 top-0">
        <Container className="flex h-18 items-center">
          <BrandMark name="opero" className="h-9 sm:h-11 lg:h-13" decorative />
        </Container>
      </div>
    </div>
  );
}
