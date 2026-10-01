'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/brand/brand-mark';
import { MODULE_LABELS, MODULE_SHOT, moduleShotPath, type ModuleName } from '@/content/constants';
import { cn } from '@/lib/cn';

export type ModuleShot = { module: ModuleName; description: string; inside: string };

type Props = { modules: ModuleShot[]; heading: string };

const navButton =
  'inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-line-input hover:bg-surface-raised disabled:pointer-events-none disabled:opacity-40';

/**
 * The screenshots behind "Look inside" on the module cards, in one native
 * modal dialog: a link with data-module-shot opens it on that module, the
 * arrows and the keyboard move between modules, Escape closes. The links
 * point at the image files themselves, so without JavaScript they still show
 * the picture. The dialog traps focus and returns it to the link afterwards.
 */
export function ModuleLightbox({ modules, heading }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  // Once opened, every screenshot is fetched, so moving between modules is instant.
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-module-shot]');
      if (!link) return;
      const index = modules.findIndex((item) => item.module === link.getAttribute('data-module-shot'));
      if (index === -1) return;
      event.preventDefault();
      setActive(index);
      setOpened(true);
      if (!dialog.current?.open) dialog.current?.showModal();
      closeButton.current?.focus();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [modules]);

  const count = modules.length;
  const go = (step: number) => setActive((index) => (index + step + count) % count);

  const current = modules[active];
  if (!current) return null;
  // The Opero logo stands where the heading says {opero}; copy saved before the logo took the module's place says {module}, and reads the same.
  const [before = '', after = ''] = heading.replace('{module}', '{opero}').split('{opero}');

  return (
    <dialog
      ref={dialog}
      aria-labelledby="module-shot-title"
      onKeyDown={(event) => {
        if (count < 2) return;
        if (event.key === 'ArrowRight') go(1);
        if (event.key === 'ArrowLeft') go(-1);
      }}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      // As wide as the screen allows, and no wider than lets the whole picture, its caption and the arrows fit the height.
      className="module-dialog m-auto w-[min(calc(100%-2*var(--o-gutter)),72rem,calc((100dvh-2*var(--o-gutter)-15rem)*1.6))] rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay"
    >
      <div className="relative flex max-h-[calc(100dvh-2*var(--o-gutter))] flex-col overflow-y-auto">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 id="module-shot-title" className="flex min-w-0 items-center gap-2.5 text-base font-semibold text-fg">
            {/* The words sit 4px up from center (half their bottom margin), so they share a baseline with the logo's letters rather than centering on the letters and jewels together. */}
            {before.trim() ? <span className="mb-2">{before.trim()}</span> : null}
            {/* Sighted visitors read the module's name in the picture itself; screen readers hear it here, where the logo shows. */}
            <BrandMark name="opero" decorative className="h-7 sm:h-8" />
            <span className="sr-only">{MODULE_LABELS[current.module]}</span>
            {after.trim() ? <span className="mb-2">{after.trim()}</span> : null}
          </h2>
          <button
            ref={closeButton}
            type="button"
            onClick={() => dialog.current?.close()}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent-soft hover:text-fg"
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <figure className="m-0">
          <div className="relative aspect-[16/10] w-full bg-canvas-raised" aria-live="polite">
            {opened
              ? modules.map((item, index) => (
                  <Image
                    key={item.module}
                    src={moduleShotPath(item.module)}
                    alt={`A screen from ${MODULE_LABELS[item.module]}.`}
                    width={MODULE_SHOT.width}
                    height={MODULE_SHOT.height}
                    sizes="(min-width: 80rem) 72rem, 100vw"
                    quality={85}
                    priority={index === active}
                    className={cn('absolute inset-0 h-full w-full object-cover', index === active ? '' : 'invisible')}
                  />
                ))
              : null}
          </div>
          <figcaption className="px-5 py-4 text-sm text-fg-muted sm:px-6 sm:text-base">
            <span className="font-medium text-fg">{current.description}</span> {current.inside}
          </figcaption>
        </figure>

        {count > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
            <button type="button" onClick={() => go(-1)} className={navButton}>
              <ChevronLeft className="size-4" aria-hidden />
              <span>
                <span className="sr-only">Previous module: </span>
                {MODULE_LABELS[modules[(active - 1 + count) % count]!.module]}
              </span>
            </button>
            <ol className="flex items-center gap-2" aria-label="Modules">
              {modules.map((item, index) => (
                <li key={item.module}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-current={index === active ? 'true' : undefined}
                    className={cn('block size-2.5 rounded-full transition-colors', index === active ? 'bg-fg' : 'bg-fg-subtle/50 hover:bg-fg-muted')}
                  >
                    <span className="sr-only">{MODULE_LABELS[item.module]}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => go(1)} className={navButton}>
              <span>
                <span className="sr-only">Next module: </span>
                {MODULE_LABELS[modules[(active + 1) % count]!.module]}
              </span>
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
