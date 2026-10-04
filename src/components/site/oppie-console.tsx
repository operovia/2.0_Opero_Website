'use client';

import { Pause, Play, Sparkles } from 'lucide-react';
import { m, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { OppieMark } from '@/components/brand/oppie-mark';
import type { ConsoleScene } from '@/content/store';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

export type ConsoleLabels = { footerLeft: string; footerRight: string; note: string };

type Phase = 'typing' | 'thinking' | 'answer' | 'shown' | 'leaving';
type State = { index: number; phase: Phase; typed: number };

const HOLD_MS = 4600;
/** The part of the hold during which the answer card and its chips appear. */
const REVEAL_MS = 900;
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
 * It opens on the first question already answered, holds it for the usual
 * time, and goes on typing from the second, so the first frame shows a
 * complete exchange. Its measure follows the screen (the console-* classes
 * in globals.css): tighter on phones and short laptops, so the card and the
 * headline share the first screen.
 */
export function OppieConsole({ scenes, labels }: { scenes: ConsoleScene[]; labels: ConsoleLabels }) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.25 });
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  );
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<State>(() => ({ index: 0, phase: 'shown', typed: scenes[0]?.question.length ?? 0 }));

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
        return next({ phase: 'shown' }, REVEAL_MS);
      case 'shown':
        return next({ phase: 'leaving' }, (reduce ? HOLD_MS * 1.6 : HOLD_MS) - REVEAL_MS);
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
        className="console-glass relative overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <div className="console-head console-rule flex items-center justify-between border-b px-5">
          <div className="flex items-center gap-1.5">
            {/* At the owner's request Oppie keeps turning while the demo runs, and holds still with it when paused. The mark's box leaves room around the pills; the negative margins keep the header its usual height. */}
            <OppieMark decorative state="thinking" paused={!running} className="-my-1 -ml-1.5 size-8" />
            <span className="text-sm font-semibold text-fg">
              Oppie
              {/* With reduced motion the pills hold still, so say it instead. */}
              {reduce && state.phase === 'thinking' ? <span className="font-normal text-fg-muted"> is thinking…</span> : null}
            </span>
          </div>
        </div>

        {/* Scenes, stacked in one cell so the console never changes size */}
        <div aria-hidden className="console-body grid grid-cols-1">
          {scenes.map((s, i) => {
            const active = i === state.index;
            const typed = active ? state.typed : 0;
            const showAnswer = active && (state.phase === 'answer' || state.phase === 'shown' || state.phase === 'leaving');
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
                <div className="console-pane flex items-start gap-3 rounded-xl border px-4 py-3.5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                  <p className="console-q text-fg">
                    <span>{s.question.slice(0, typed)}</span>
                    {active && state.phase === 'typing' ? <span className="console-caret" /> : null}
                    <span className={cn('console-rest', i === 0 && 'console-first')}>{s.question.slice(typed)}</span>
                  </p>
                </div>

                <div className="console-gap relative">
                  <m.div
                    data-reveal={i === 0 ? '' : undefined}
                    initial={false}
                    animate={showAnswer ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, ease: tokens.motion.ease.out }}
                    className="console-pane console-body rounded-xl border"
                  >
                    {s.answerTag ? <p className="text-eyebrow font-semibold text-fg-subtle uppercase">{s.answerTag}</p> : null}
                    <p className="console-main mt-2 font-semibold text-metal">{s.answerMain}</p>
                    {s.answerSupport ? <p className="console-support mt-2 text-fg-muted">{s.answerSupport}</p> : null}
                    {s.answerTable ? (
                      // Phones show the first three columns and the first two rows; wider screens show them all.
                      <table className="mt-3 w-full text-xs">
                        <thead>
                          <tr>
                            {s.answerTable.columns.map((column, c) => (
                              <th
                                key={column + c}
                                scope="col"
                                className={cn(
                                  'pb-2 text-xs font-medium text-fg-subtle',
                                  c === 0 ? 'text-left' : 'pl-3 text-right whitespace-nowrap',
                                  c > 2 && 'hidden sm:table-cell',
                                )}
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.answerTable.rows.map((row, r) => (
                            <m.tr
                              key={r}
                              initial={false}
                              animate={{ opacity: showAnswer ? 1 : 0 }}
                              transition={{ duration: 0.4, delay: showAnswer ? 0.15 + r * 0.07 : 0, ease: tokens.motion.ease.out }}
                              data-reveal={i === 0 ? '' : undefined}
                              className={cn('console-rule border-t', r >= 2 && 'console-row-extra')}
                            >
                              {row.map((cell, c) => (
                                <td
                                  key={c}
                                  className={cn(
                                    'console-cell',
                                    c === 0 ? 'font-medium text-fg' : 'pl-3 text-right whitespace-nowrap text-fg-muted tabular-nums',
                                    c > 2 && 'hidden sm:table-cell',
                                  )}
                                >
                                  {cell}
                                </td>
                              ))}
                            </m.tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null}
                    {s.chips.length ? (
                      <ul className="console-chips mt-3 flex gap-2">
                        {s.chips.map((chip, c) => (
                          <m.li
                            key={chip + c}
                            initial={false}
                            animate={showAnswer ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                            transition={{ duration: 0.4, delay: showAnswer ? 0.15 + c * 0.07 : 0, ease: tokens.motion.ease.out }}
                            data-reveal={i === 0 ? '' : undefined}
                            className="console-pane rounded-full border px-3 py-1 text-xs font-medium text-fg-muted"
                          >
                            {chip}
                          </m.li>
                        ))}
                      </ul>
                    ) : null}
                    {s.followUp ? (
                      <m.p
                        initial={false}
                        animate={{ opacity: showAnswer ? 1 : 0 }}
                        transition={{ duration: 0.4, delay: showAnswer ? 0.5 : 0, ease: tokens.motion.ease.out }}
                        data-reveal={i === 0 ? '' : undefined}
                        className="console-follow console-rule mt-3 border-t pt-3 text-sm font-medium text-fg"
                      >
                        {s.followUp}
                      </m.p>
                    ) : null}
                  </m.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="console-head console-rule flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-5">
          <p className="console-foot flex flex-wrap gap-x-3 gap-y-1 text-micro font-semibold text-fg-subtle uppercase">
            <span className="whitespace-nowrap">{labels.footerLeft}</span>
            <span className="console-foot-extra whitespace-nowrap">{labels.footerRight}</span>
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

      {labels.note ? <p className="mt-2 text-center text-xs text-fg-subtle">{labels.note}</p> : null}

      {/* The same conversation for screen readers, without the animation. */}
      <ul className="sr-only">
        {scenes.map((s) => (
          <li key={s.id}>
            Question: {s.question} Oppie answers: {s.answerTag ? `${s.answerTag}. ` : ''}
            {s.answerMain}. {s.answerSupport} {s.chips.join(', ')}
            {s.answerTable ? ` ${s.answerTable.rows.map((row) => row.map((cell, c) => `${s.answerTable!.columns[c]}: ${cell}`).join(', ')).join('. ')}.` : ''}
            {s.followUp ? ` ${s.followUp}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
