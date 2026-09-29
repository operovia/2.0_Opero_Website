'use client';

import { ArrowRight } from 'lucide-react';
import { m, useAnimate, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { enterDoor } from '@/app/(door)/welcome/actions';
import { BrandMark } from '@/components/brand/brand-mark';
import { Eyebrow, SiteButton } from '@/components/site/layout-parts';
import { Light } from '@/components/site/light';
import { SpamTraps, stampElapsed } from '@/components/site/spam-traps';
import { Input } from '@/components/ui/field';
import { DOOR_ANSWERS, DOOR_ENHANCED_FIELD, type DoorAnswer } from '@/content/constants';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { idleState, type FormState } from '@/lib/forms';
import { renderHeadline } from '@/lib/headline';
import { tokens } from '@/theme/tokens';
import { beginArrival } from './door-store';

const { duration, ease, links, door } = tokens.motion;
const seconds = (ms: number) => ms / 1000;
/** How much the line warms with each typed character. */
const WARMTH_PER_CHARACTER = 0.08;
/** The line's warmth while the light holds after its last run, and during the check under reduced motion. */
const WARMTH_HOLD = 0.5;

type Content = SectionData<'welcome', 'door'>;
type Phase = 'idle' | 'checking' | 'open' | 'gone';
type Status = '' | 'checking' | 'still' | 'welcome';
type Answer = { code: DoorAnswer; wait: string };

const isAnswer = (code: string): code is DoorAnswer => (DOOR_ANSWERS as readonly string[]).includes(code);

/** The answer a returned state carries, if it is a miss. */
function answerFrom(state: FormState): Answer | null {
  if (state.status !== 'error' || !state.message) return null;
  return { code: isAnswer(state.message) ? state.message : 'trouble', wait: state.values?.wait ?? '' };
}

/** Whether the value has the shape of an address: an @ with a dot somewhere after it. No claim of validity. */
const looksLikeAddress = (value: string) => /\S@\S+\.\S/.test(value);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function copyFor(content: Content, answer: Answer): { message: string; help: string } {
  switch (answer.code) {
    case 'empty':
      return { message: content.emptyMessage, help: '' };
    case 'invalid':
      return { message: content.invalidMessage, help: '' };
    case 'limited':
      return { message: content.limitMessage.split('{wait}').join(answer.wait), help: '' };
    case 'trouble':
      return { message: content.troubleMessage, help: '' };
    default:
      return { message: content.wrongMessage, help: content.wrongHelp };
  }
}

const dissolve = { duration: seconds(duration.slow), ease: ease.standard };

type Props = { content: Content; contactEmail: string; alreadyIn: boolean };

/**
 * The front door (/welcome): one dark screen with the mark, a point of light
 * on a line, and a box-less field for the address an invitation went to.
 * The form posts to enterDoor through Next's progressive enhancement, so it
 * works without JavaScript; with it, the checking light runs along the line
 * while the list is checked, a miss settles calmly onto the status row, and
 * a yes turns the key: the line flashes, the door dissolves on its own
 * canvas, and the veil (src/components/door/door-veil.tsx) takes over at the
 * exact spot of the mark before the home page is pushed.
 */
export function Door({ content, contactEmail, alreadyIn }: Props) {
  const [state, formAction] = useActionState(enterDoor, idleState);
  // Read once: the action's cookie write re-renders the page, and nothing on screen may change under the guest mid-choreography.
  const [inside] = useState(alreadyIn);
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<Status>('');
  const [value, setValue] = useState(() => state.values?.email ?? '');
  const [answer, setAnswer] = useState<Answer | null>(() => answerFrom(state));
  const [tinted, setTinted] = useState(() => answerFrom(state) !== null);
  const [held, setHeld] = useState(false);
  const [answers, setAnswers] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const router = useRouter();
  const [line, animate] = useAnimate<HTMLDivElement>();
  const input = useRef<HTMLInputElement>(null);
  const enhanced = useRef<HTMLInputElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLElement>(null);
  const answering = useRef<((state: FormState) => void) | null>(null);
  const alive = useRef(true);
  const id = useId();
  const inputId = `${id}-email`;
  const statusId = `${id}-status`;
  const errorId = `${id}-error`;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The action has answered: whoever is waiting on it hears.
  useEffect(() => {
    answering.current?.(state);
    answering.current = null;
  }, [state]);

  const checking = phase === 'checking';
  const opened = phase === 'open' || phase === 'gone';
  const ready = phase === 'idle' && looksLikeAddress(value);
  const warmth = opened ? 1 : checking ? (reduced || held ? WARMTH_HOLD : 0) : Math.min(1, value.length * WARMTH_PER_CHARACTER);
  const statusText =
    status === 'checking' ? content.checkingStatus : status === 'still' ? content.stillCheckingStatus : status === 'welcome' ? content.welcomeStatus : '';
  const shown = answer ? copyFor(content, answer) : null;
  const gone = { initial: false as const, animate: opened ? { opacity: 0, y: door.lift } : { opacity: 1, y: 0 }, transition: dissolve };

  /** One run of the light along the line, or the same time standing still under reduced motion. */
  async function runOnce(): Promise<void> {
    if (reduced || !line.current) return wait(links.across);
    const run = { duration: seconds(links.across), ease: 'linear' as const };
    const lights = [
      animate('[data-door-light="left"]', { x: ['100%', '-100%'] }, run),
      animate('[data-door-light="right"]', { x: ['-100%', '100%'] }, run),
      animate('[data-door-light="full"]', { x: ['-100%', '100%'] }, run),
    ];
    await Promise.all(lights.map((controls) => controls.finished));
  }

  /** From submit to the answer: the light runs until the answer is in, at most `runs` times, then holds. Every answer is acted on only once the current run has reached the ends. */
  async function check(answered: Promise<FormState>): Promise<void> {
    const arrival = { state: null as FormState | null };
    void answered.then((result) => (arrival.state = result));
    for (let runs = 0; runs < door.runs && !arrival.state; runs++) {
      await runOnce();
      if (!alive.current) return;
    }
    if (!arrival.state) {
      setHeld(true);
      setStatus('still');
      arrival.state = await answered;
      if (!alive.current) return;
    }
    if (arrival.state.status === 'success') await open();
    else miss(arrival.state);
  }

  function miss(result: FormState): void {
    flushSync(() => {
      setPhase('idle');
      setStatus('');
      setHeld(false);
      setAnswer(answerFrom(result) ?? { code: 'trouble', wait: '' });
      setAnswers((n) => n + 1);
      setTinted(true);
    });
    const field = input.current;
    if (field) {
      field.focus();
      field.select();
    }
  }

  /** S0: the key turns. The flash and the dissolve here, then the veil takes over at the exact rect of the mark, and the home page is pushed. */
  async function open(): Promise<void> {
    input.current?.blur();
    flushSync(() => {
      setPhase('open');
      setStatus('welcome');
    });
    await wait(duration.slow);
    if (!alive.current) return;
    const markBox = mark.current?.querySelector('svg')?.getBoundingClientRect();
    const spark = (line.current?.querySelector('.door-point') ?? entry.current)?.getBoundingClientRect();
    if (!markBox || !spark) {
      router.push('/');
      return;
    }
    flushSync(() => {
      beginArrival({
        markRect: { top: markBox.top, left: markBox.left, width: markBox.width, height: markBox.height },
        point: { x: spark.left + spark.width / 2, y: spark.top + spark.height / 2 },
        reduced,
      });
      setPhase('gone');
    });
    if (!reduced) document.documentElement.dataset.doorArrival = 'held';
    router.push('/');
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    if (phase !== 'idle') {
      event.preventDefault();
      return;
    }
    stampElapsed(event.currentTarget);
    if (enhanced.current) enhanced.current.value = '1';
    const answered = new Promise<FormState>((resolve) => {
      answering.current = resolve;
    });
    setPhase('checking');
    setStatus('checking');
    setAnswer(null);
    setTinted(false);
    void check(answered);
  }

  /** A returning guest plays the reveal again from S0, with no check. Without JavaScript the button is a plain link home. */
  function replay(event: MouseEvent<HTMLElement>): void {
    if (phase !== 'idle') return;
    event.preventDefault();
    event.stopPropagation();
    void open();
  }

  const linkStyle = 'underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg hover:decoration-fg';

  return (
    <main className="flex flex-1 flex-col items-center px-gutter">
      <div className="flex w-full max-w-lg flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-start pt-24 text-center sm:justify-center sm:pt-0 sm:pb-20">
          <div ref={mark} className={cn('door-mark-in', phase === 'gone' && 'invisible')}>
            <BrandMark name="opero" className="h-12 sm:h-20" priority />
          </div>

          <m.div {...gone} className="mt-12 w-full">
            {content.eyebrow ? (
              <div className="door-rise [animation-delay:400ms]">
                <Eyebrow>{content.eyebrow}</Eyebrow>
              </div>
            ) : null}
            <div className="door-rise mt-4 [animation-delay:400ms]">
              <h1 className="text-2xl font-medium text-metal sm:text-3xl">{renderHeadline(inside ? content.alreadyInTitle : content.title)}</h1>
            </div>
            <div className="door-rise [animation-delay:460ms]">
              <p className="mt-3 text-base text-fg-muted sm:text-lg">{inside ? content.alreadyInIntro : content.intro}</p>
            </div>
          </m.div>

          {inside ? (
            <m.div {...gone} className="door-fade mt-10 [animation-delay:700ms]">
              {/* The click is taken here, before the link's own handler, so the reveal plays; without JavaScript it is a plain link. */}
              <span ref={entry} onClickCapture={replay}>
                <SiteButton href="/" size="lg">
                  {content.alreadyInButton}
                </SiteButton>
              </span>
            </m.div>
          ) : (
            <m.form
              {...gone}
              action={formAction}
              onSubmit={submit}
              noValidate
              aria-busy={checking || undefined}
              className="door-field mt-10 w-full"
              data-typed={value ? '' : undefined}
              data-ready={ready ? '' : undefined}
              data-answer={answer && tinted ? answer.code : undefined}
              data-open={opened ? '' : undefined}
              data-checking={checking ? '' : undefined}
            >
              <SpamTraps />
              <input ref={enhanced} type="hidden" name={DOOR_ENHANCED_FIELD} defaultValue="" />
              <div className="door-rise [animation-delay:520ms]">
                <label htmlFor={inputId} className="door-label block text-sm font-medium text-fg-subtle">
                  {content.emailLabel}
                </label>
              </div>
              <div className="relative mt-1 h-14">
                <Input
                  ref={input}
                  id={inputId}
                  variant="line"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="go"
                  required
                  readOnly={checking}
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    if (tinted) setTinted(false);
                  }}
                  aria-invalid={answer ? true : undefined}
                  aria-describedby={answer ? `${statusId} ${errorId}` : statusId}
                  className="door-input h-full pr-14 pl-0 text-left focus-visible:outline-none sm:px-14 sm:text-center"
                />
                <button
                  type="submit"
                  aria-label={checking ? content.checkingLabel : content.submitLabel}
                  aria-disabled={checking || undefined}
                  title={content.submitLabel}
                  className="door-fade absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line-strong text-fg-muted [animation-delay:700ms]"
                >
                  <ArrowRight className="size-4" aria-hidden />
                  <ArrowRight className="door-arrow-lit absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-fg opacity-0" aria-hidden />
                  <span className="door-ring-lit absolute inset-0 rounded-full border border-focus-ring opacity-0" aria-hidden />
                </button>
              </div>
              {/* The line: the resting hairline, a warm overlay, a rose overlay, the running lights, two end dots, and the point of light. */}
              <div ref={line} aria-hidden className="pointer-events-none relative h-px w-full" style={{ '--door-warm': warmth } as CSSProperties}>
                <span className="door-line-in absolute inset-0 bg-line-input [animation-delay:300ms]" />
                <span className="door-line-warm absolute inset-0 bg-fg" />
                <span className="door-line-danger absolute inset-0 bg-danger opacity-0" />
                <span className="absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden sm:block">
                  <Light data-door-light="left" initial={{ x: '100%' }} />
                </span>
                <span className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden sm:block">
                  <Light data-door-light="right" initial={{ x: '-100%' }} />
                </span>
                <span className="absolute inset-0 overflow-hidden sm:hidden">
                  <Light data-door-light="full" initial={{ x: '-100%' }} />
                </span>
                <span className="door-dot absolute top-1/2 left-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0" />
                <span className="door-dot absolute top-1/2 right-0 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0" />
                <span className="door-point-in absolute top-1/2 left-0 size-1.5 -translate-x-1/2 -translate-y-1/2 sm:left-1/2">
                  <span className="door-point inset-0" />
                </span>
              </div>
              {/* Room for the longest answer (two lines and its help line) from first paint, so nothing above it moves when one appears. */}
              <div className="mt-4 min-h-12 sm:min-h-20">
                {/* Announced always; shown when the light has stopped, and under reduced motion (a CSS variant, so the server and the client agree). */}
                <p
                  id={statusId}
                  role="status"
                  aria-live="polite"
                  className={cn('text-sm text-fg-muted', status !== 'still' && 'sr-only motion-reduce:not-sr-only')}
                >
                  {statusText}
                </p>
                {shown ? (
                  <div key={answers} className="door-message-in">
                    <p id={errorId} role="alert" className="text-sm text-danger">
                      {shown.message}
                    </p>
                    {shown.help ? <p className="mt-1 text-sm text-fg-subtle">{shown.help}</p> : null}
                  </div>
                ) : null}
              </div>
              <p className="door-fade mt-8 text-sm text-fg-subtle [animation-delay:700ms]">
                {content.helpLine}{' '}
                <a href={`mailto:${contactEmail}`} className={linkStyle}>
                  {content.helpLinkLabel}
                </a>
              </p>
            </m.form>
          )}
        </div>

        <m.div
          {...gone}
          className="door-fade flex w-full flex-col items-center gap-3 py-10 text-center [animation-delay:700ms] sm:flex-row sm:items-end sm:justify-between sm:text-left"
        >
          <p className="text-micro font-semibold text-fg-subtle uppercase">{content.companyLine}</p>
          <p className="text-sm text-fg-subtle">
            {content.publicLine}{' '}
            <Link href="/" prefetch={false} className={linkStyle}>
              {content.publicLinkLabel}
            </Link>
          </p>
        </m.div>
      </div>
    </main>
  );
}
