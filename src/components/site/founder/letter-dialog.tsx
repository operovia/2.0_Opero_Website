'use client';

import { ArrowRight, BookOpen, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { closeButton } from '@/components/site/home/lightbox';
import { cn } from '@/lib/cn';

/** The letter's address on the page: a link to it opens it, and without JavaScript the button jumps to it. */
const LETTER_ID = 'founder-letter';

function openLetter(dialog: HTMLDialogElement | null): void {
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  // Each reading starts at the top, with focus on the close button, as in the site's other dialogs.
  dialog.querySelector('[data-letter-scroll]')?.scrollTo(0, 0);
  dialog.querySelector<HTMLButtonElement>('[data-letter-close]')?.focus();
}

/**
 * The button that opens the founder's letter, and the letter in a native
 * modal dialog: dark whatever the page's theme, as long as the window, with
 * the close button kept in reach while it scrolls. Escape, the close button
 * or a click outside closes it, and focus goes back to the button. A link to
 * #founder-letter opens it too. Without JavaScript the button jumps to the
 * letter, which then shows in the page.
 */
export function LetterDialog({ label, children }: { label: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === `#${LETTER_ID}`) openLetter(dialog.current);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      {/* The glow sits behind the button rather than inside it, so it stays behind while the button lifts. */}
      <span className="letter-cta relative mt-10 inline-flex">
        <span aria-hidden className="letter-glow" />
        <a
          href={`#${LETTER_ID}`}
          aria-haspopup="dialog"
          onClick={(event) => {
            event.preventDefault();
            openLetter(dialog.current);
          }}
          className="letter-button relative inline-flex h-14 items-center gap-3 rounded-full px-7 text-lg font-semibold text-fg"
        >
          <span aria-hidden className="letter-sheen" />
          <BookOpen aria-hidden className="size-5" />
          {label}
          <ArrowRight aria-hidden className="letter-arrow size-5" />
        </a>
      </span>
      <noscript>
        <style>{`#${LETTER_ID}:target{display:block;position:static;margin-top:2.5rem}`}</style>
      </noscript>
      <dialog
        id={LETTER_ID}
        ref={dialog}
        data-theme="dark"
        aria-labelledby="founder-letter-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        onClose={() => {
          if (window.location.hash === `#${LETTER_ID}`) window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }}
        className="letter-dialog m-auto w-[min(calc(100%-2*var(--o-gutter)),46rem)] rounded-2xl border border-line-strong bg-canvas p-0 text-fg shadow-lg backdrop:bg-overlay"
      >
        <div data-letter-scroll className="max-h-[calc(100dvh-2*var(--o-gutter))] overflow-y-auto overscroll-contain">
          <div className="pointer-events-none sticky top-0 z-10 flex justify-end p-3">
            <button
              type="button"
              data-letter-close
              onClick={() => dialog.current?.close()}
              className={cn(closeButton, 'pointer-events-auto bg-canvas/80 backdrop-blur')}
            >
              <X className="size-5" aria-hidden />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <article className="px-6 pb-14 sm:px-14 sm:pb-16">{children}</article>
        </div>
      </dialog>
    </>
  );
}
