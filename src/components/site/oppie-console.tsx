'use client';

import { Pause, Play, Sparkles } from 'lucide-react';
import { m, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { OppieMark } from '@/components/brand/oppie-mark';
import type { ConsoleScene } from '@/content/store';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

export type ConsoleLabels = { badge: string; footerLeft: string; footerRight: string; note: string };

type Phase = 'typing' | 'thinking' | 'answer' | 'leaving';
type State = { index: number; phase: Phase; typed: number };

const HOLD_MS = 4600;
const LEAVE_MS = 500;
const AFTER_TYPING_MS = 380;

function typingDelay(char: string): number {
  if (/[?.,!]/.test(char)) return 150;
  if (char === ' ') return 45;
  return 26 + Math.random() * 30;
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}

/**
 * The hero's live Oppie console: a scripted, looping demo that types a
 * portfolio question, thinks, and answers. Scenes are edited in the admin.
 */
export function OppieConsole({ scenes, labels }: { scenes: ConsoleScene[]; labels: ConsoleLabels }) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });
  const pageVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible', () => true);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<State>({ index: 0, phase: 'typing', typed: 0 });

  const scene = scenes[state.index];
  const running = inView && pageVisible && !paused && scenes.length > 0;

  useEffect(() => {
    if (!running || !scene) return;
    const next = (update: Partial<State>, delay: number) => {
      const timer = window.setTimeout(() => setState((s) => ({ ...s, ...update })), delay);
      return () => window.clearTimeout(timer);
    };
    switch (state.phase) {
      case 'typing':
        if (reduce) return next({ typed: scene.question.length, phase: 'thinking' }, 0);
        if (state.typed < scene.question.length) return next({ typed: state.typed + 1 }, typingDelay(scene.question[state.typed]!));
        return next({ phase: 'thinking' }, AFTER_TYPING_MS);
      case 'thinking':
        return next({ phase: 'answer' }, reduce ? 500 : scene.thinkingMs);
      case 'answer':
        return next({ phase: 'leaving' }, reduce ? HOLD_MS * 1.6 : HOLD_MS);
      case 'leaving': {
        const index = (state.index + 1) % scenes.length;
        return next({ index, phase: 'typing', typed: 0 }, LEAVE_MS);
      }
    }
  }, [running, reduce, scene, scenes.length, state]);

  const goTo = (index: number) => setState({ index, phase: 'typing', typed: 0 });

  if (!scenes.length) return null;

  return (
    <div ref={rootRef} className="relative">
      <div
        role="group"
        aria-roledescription="demo"
        aria-label="Oppie answering portfolio questions"
        className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface/80 shadow-lg backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            {/* The mark's box leaves room around the pie; the negative margins keep the header its usual height. */}
            <OppieMark decorative still className="-my-1 -ml-1 size-7" />
            <span className="text-sm font-semibold text-fg">Oppie</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong px-2.5 py-1 text-micro font-semibold text-fg-muted uppercase">
            <span className="console-live-dot relative inline-flex size-1.5 rounded-full bg-success" aria-hidden />
            {labels.badge}
          </span>
        </div>

        {/* Scenes, stacked in one cell so the console never changes size */}
        <div aria-hidden className="grid grid-cols-1 px-5 pt-5 pb-6">
          {scenes.map((s, i) => {
            const active = i === state.index;
            const typed = active ? state.typed : 0;
            const showAnswer = active && (state.phase === 'answer' || state.phase === 'leaving');
            const leaving = active && state.phase === 'leaving';
            return (
              <div
                key={s.id}
                className={cn(
                  'col-start-1 row-start-1 transition-opacity duration-500',
                  active && !leaving ? 'opacity-100' : 'opacity-0',
                  !active && 'invisible',
                )}
              >
                <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                  <p className="text-base text-fg">
                    <span>{s.question.slice(0, typed)}</span>
                    {active && state.phase === 'typing' ? <span className="console-caret" /> : null}
                    <span className={cn('console-rest', i === 0 && 'console-first')}>{s.question.slice(typed)}</span>
                  </p>
                </div>

                <div className="relative mt-4">
                  {/* Oppie thinking. It keeps moving while the answer is up (hidden by then), so it never snaps to rest mid-fade. */}
                  <div
                    className={cn(
                      'absolute -top-1 -left-1 transition-opacity duration-300',
                      active && state.phase === 'thinking' ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <OppieMark
                      decorative
                      state="thinking"
                      still={!running || !active || (state.phase !== 'thinking' && state.phase !== 'answer')}
                      className="size-10"
                    />
                  </div>

                  <m.div
                    data-reveal={i === 0 ? '' : undefined}
                    initial={false}
                    animate={showAnswer ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, ease: tokens.motion.ease.out }}
                    className="rounded-xl border border-line bg-surface-raised/70 p-5"
                  >
                    {s.answerTag ? <p className="text-eyebrow font-semibold text-fg-subtle uppercase">{s.answerTag}</p> : null}
                    <p className="mt-2 text-2xl font-semibold text-metal">{s.answerMain}</p>
                    {s.answerSupport ? <p className="mt-2 text-sm text-fg-muted">{s.answerSupport}</p> : null}
                    {s.chips.length ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {s.chips.map((chip, c) => (
                          <m.li
                            key={chip + c}
                            initial={false}
                            animate={showAnswer ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                            transition={{ duration: 0.4, delay: showAnswer ? 0.15 + c * 0.07 : 0, ease: tokens.motion.ease.out }}
                            data-reveal={i === 0 ? '' : undefined}
                            className="rounded-full border border-line-strong bg-canvas/50 px-3 py-1 text-xs font-medium text-fg-muted"
                          >
                            {chip}
                          </m.li>
                        ))}
                      </ul>
                    ) : null}
                  </m.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5 py-3">
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-micro font-semibold text-fg-subtle uppercase">
            <span className="whitespace-nowrap">{labels.footerLeft}</span>
            <span className="whitespace-nowrap">{labels.footerRight}</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {scenes.length > 1
              ? scenes.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show question ${i + 1} of ${scenes.length}`}
                    aria-current={i === state.index ? 'true' : undefined}
                    className="group inline-flex size-6 items-center justify-center rounded-full"
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full transition-[transform,background-color] duration-300',
                        i === state.index ? 'scale-125 bg-fg' : 'bg-line-strong group-hover:bg-fg-subtle',
                      )}
                    />
                  </button>
                ))
              : null}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play the demo' : 'Pause the demo'}
              className="ml-1 inline-flex size-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-accent-soft hover:text-fg"
            >
              {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {labels.note ? <p className="mt-3 text-center text-xs text-fg-subtle">{labels.note}</p> : null}

      {/* The same conversation for screen readers, without the animation. */}
      <ul className="sr-only">
        {scenes.map((s) => (
          <li key={s.id}>
            Question: {s.question} Oppie answers: {s.answerTag ? `${s.answerTag}. ` : ''}
            {s.answerMain}. {s.answerSupport} {s.chips.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
