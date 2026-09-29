import { useSyncExternalStore } from 'react';

/**
 * What the front door hands to the veil and the home page across the route
 * change from /welcome to /: one module-level store, read with
 * useSyncExternalStore by src/components/door/door.tsx (which begins the
 * arrival), door-veil.tsx (which plays it from the root layout) and
 * door-arrival.tsx (which signals from inside the mounted hero).
 */

export type DoorRect = { top: number; left: number; width: number; height: number };
export type DoorPoint = { x: number; y: number };

export type DoorState = {
  phase: 'idle' | 'opening';
  /** Where the door's mark sits, in viewport pixels, so the veil's copy can take its place exactly. */
  markRect: DoorRect | null;
  /** Where the caret was, in viewport pixels: the spark returns there. */
  point: DoorPoint | null;
  /** The door's reading of prefers-reduced-motion, so the veil plays the same timeline. */
  reduced: boolean;
  /** Set by the home page's hero once it has mounted under the veil. */
  arrived: boolean;
  /** When router.push('/') was issued; the veil gives up a while after it. */
  pushedAt: number;
};

const idle: DoorState = { phase: 'idle', markRect: null, point: null, reduced: false, arrived: false, pushedAt: 0 };

let state: DoorState = idle;
const listeners = new Set<() => void>();

function set(next: DoorState): void {
  state = next;
  for (const listener of listeners) listener();
}

/** The door has dissolved and is about to push to the home page. */
export function beginArrival({ markRect, point, reduced }: { markRect: DoorRect; point: DoorPoint; reduced: boolean }): void {
  set({ phase: 'opening', markRect, point, reduced, arrived: false, pushedAt: Date.now() });
}

/** The home page's hero has mounted beneath the veil. */
export function arrived(): void {
  if (state.phase === 'opening' && !state.arrived) set({ ...state, arrived: true });
}

/** The crossing is over (or abandoned): the veil unmounts. */
export function endArrival(): void {
  if (state !== idle) set(idle);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): DoorState {
  return state;
}

/** The store, for components: idle on the server and until the door opens. */
export function useDoorState(): DoorState {
  return useSyncExternalStore(subscribe, getSnapshot, () => idle);
}
