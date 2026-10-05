'use client';

import { useId, useState, type CSSProperties } from 'react';
import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { capTableView, money, type CapTableConfig } from '@/lib/cap-table-math';

type Props = {
  /** The round section of the Data Room: the copy and the figures, from the server page. */
  content: SectionData<'investors', 'round'>;
};

/**
 * Jewels for the capitalization table: the holders already on the table in
 * brand order (crimson, violet, gold), the reader in teal, the rest of the
 * round in green. Full class names, so Tailwind finds them.
 */
const jewels = {
  crimson: 'jewel-crimson',
  violet: 'jewel-violet',
  gold: 'jewel-gold',
  green: 'jewel-green',
  teal: 'jewel-teal',
} as const;
type JewelName = keyof typeof jewels;
const existingJewels: JewelName[] = ['crimson', 'violet', 'gold'];

/** One row of the table: a holder already on it, the reader, or the rest of the round, with its figures as the math returns them. */
type Row = {
  key: string;
  holder: string;
  class: string;
  jewel: JewelName;
  you: boolean;
  today: string;
  /** Share count today, shown under today's percentage; empty for the holders the round brings in. */
  sharesToday: string;
  after: string;
  sharesAfter: string;
  bar: number;
};

const after = (row: { after: string; shares: string; bar: number }) => ({ after: row.after, sharesAfter: row.shares, bar: row.bar });

/** The bar's colors, read by .round-bar in globals.css; its width is the exact ownership, as a percentage. */
const barStyle = (jewel: JewelName, width: number) =>
  ({
    '--round-jewel': `var(--o-jewel-${jewel}-base)`,
    '--round-jewel-highlight': `var(--o-jewel-${jewel}-highlight)`,
    width: `${Math.min(100, Math.max(0, width))}%`,
  }) as CSSProperties;

/**
 * The Cap Table tab: the capitalization table today and after the round
 * converts, then the investment model (a slider and three figures), whose
 * amount is the reader's row in the table, and the small print. Every
 * figure comes from the section's stored numbers through
 * src/lib/cap-table-math.ts, in exact whole-number arithmetic; the slider
 * only chooses the amount. Shown to guests and admins only; the round's
 * terms stand on The Raise tab (raise-terms.tsx).
 */
export function CapTableSection({ content }: Props) {
  const sliderId = useId();
  const config: CapTableConfig = {
    holders: content.capTable,
    raise: content.raise,
    cap: content.cap,
    minimum: content.minimum,
    step: content.step,
    start: content.start,
  };
  const bounds = { min: content.minimum, max: content.maximum, step: content.step };
  const [chosen, setChosen] = useState(content.start);
  // Every figure comes from the math, for the amount it settles on; never from the raw slider value.
  const view = capTableView(config, chosen);
  const amount = view.amount;
  const fill = bounds.max > bounds.min ? ((amount - bounds.min) / (bounds.max - bounds.min)) * 100 : 0;

  const rows: Row[] = [
    ...view.existing.map((row, i) => ({
      key: `existing-${i}`,
      holder: row.holder,
      class: row.class,
      jewel: existingJewels[i % existingJewels.length]!,
      you: false,
      today: row.today,
      sharesToday: row.shares,
      after: row.after,
      sharesAfter: row.shares,
      bar: row.bar,
    })),
    { key: 'you', holder: content.youLabel, class: '', jewel: 'teal', you: true, today: view.todayNone, sharesToday: '', ...after(view.you) },
    { key: 'others', holder: content.othersLabel, class: '', jewel: 'green', you: false, today: view.todayNone, sharesToday: '', ...after(view.others) },
  ];

  const stats = [
    { label: content.shareLabel, value: view.shareOfRound },
    { label: content.ownershipLabel, value: view.you.after },
    { label: content.remainingLabel, value: view.remaining },
  ];

  return (
    <>
      {/* The capitalization table, today and after the round converts. */}
      <Reveal className="mt-10">
        <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-2 sm:px-6">
          {/* Explicit roles: on phones the rows and cells are shown as blocks, and WebKit drops the table's roles unless they are stated. */}
          <table role="table" className="w-full border-collapse text-left">
            <caption className="sr-only">{content.capHeading}</caption>
            {/* On phones each row stacks and carries its own labels, so the header row is not needed there. */}
            <thead role="rowgroup" className="hidden sm:table-header-group">
              <tr role="row" className="text-micro font-semibold text-fg-subtle uppercase">
                <th role="columnheader" scope="col" className="py-3 pr-4 font-semibold">
                  {content.holderColumn}
                </th>
                <th role="columnheader" scope="col" className="py-3 pr-4 font-semibold">
                  {content.classColumn}
                </th>
                <th role="columnheader" scope="col" className="py-3 pr-4 font-semibold">
                  {content.todayColumn}
                </th>
                <th role="columnheader" scope="col" className="w-2/5 py-3 font-semibold">
                  {content.afterColumn}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {rows.map((row) => {
                const { jewel, you } = row;
                return (
                  <tr role="row" key={row.key} className={cn('block border-t border-line py-4 sm:table-row sm:py-0', you && 'font-semibold')}>
                    <th role="rowheader" scope="row" className="block pr-4 sm:table-cell sm:py-4 sm:align-top">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', jewels[jewel])} />
                        <span className={cn('text-base text-fg', you ? 'font-semibold' : 'font-medium')}>{row.holder}</span>
                      </span>
                      {row.class ? <span className="mt-0.5 block pl-5 text-sm font-normal text-fg-muted sm:hidden">{row.class}</span> : null}
                    </th>
                    <td role="cell" className="hidden pr-4 text-sm text-fg-muted sm:table-cell sm:py-4 sm:align-top">
                      {row.class}
                    </td>
                    <td role="cell" className="mt-3 flex items-baseline justify-between gap-4 pl-5 sm:mt-0 sm:table-cell sm:pr-4 sm:pl-0 sm:py-4 sm:align-top">
                      <span className="text-sm text-fg-subtle sm:hidden">{content.todayColumn}</span>
                      <span className="text-right sm:text-left">
                        <span className="block text-base text-fg tabular-nums">{row.today}</span>
                        {row.sharesToday ? (
                          <span className="block text-sm font-normal text-fg-subtle tabular-nums">
                            {row.sharesToday} {content.sharesUnit}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td role="cell" className="mt-2 block pl-5 sm:mt-0 sm:table-cell sm:py-4 sm:pl-0 sm:align-top">
                      <span className="flex items-baseline justify-between gap-4 sm:block">
                        <span className="text-sm text-fg-subtle sm:hidden">{content.afterColumn}</span>
                        <span className="text-right sm:text-left">
                          <span className="block text-base text-fg tabular-nums">{row.after}</span>
                          <span className="block text-sm font-normal text-fg-subtle tabular-nums">
                            {row.sharesAfter} {content.sharesUnit}
                          </span>
                        </span>
                      </span>
                      <span aria-hidden className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <span className="round-bar block h-full rounded-full" style={barStyle(jewel, row.bar)} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot role="rowgroup">
              <tr role="row" className="block border-t border-line-strong py-4 text-sm text-fg-muted sm:table-row sm:py-0">
                <th role="rowheader" scope="row" className="block pr-4 text-left font-semibold text-fg sm:table-cell sm:py-4">
                  {content.totalLabel}
                </th>
                <td role="cell" className="hidden sm:table-cell sm:py-4" />
                <td role="cell" className="mt-2 flex items-baseline justify-between gap-4 sm:mt-0 sm:table-cell sm:py-4 sm:pr-4">
                  <span className="text-fg-subtle sm:hidden">{content.todayColumn}</span>
                  <span className="text-right tabular-nums sm:text-left">
                    {view.totalToday.percent}
                    <span className="block text-fg-subtle">
                      {view.totalToday.shares} {content.sharesUnit}
                    </span>
                  </span>
                </td>
                <td role="cell" className="mt-2 flex items-baseline justify-between gap-4 sm:mt-0 sm:table-cell sm:py-4">
                  <span className="text-fg-subtle sm:hidden">{content.afterColumn}</span>
                  <span className="text-right tabular-nums sm:text-left">
                    {view.totalAfter.percent}
                    <span className="block text-fg-subtle">
                      {view.totalAfter.shares} {content.sharesUnit}
                    </span>
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-4 text-sm text-fg-muted">
          {content.priceLabel}: <span className="font-medium text-fg tabular-nums">{view.price}</span>
        </p>
        <p className="mt-3 max-w-3xl text-sm text-fg-subtle">{content.capNote}</p>
      </Reveal>
      {/* The model: the slider chooses the amount, the three figures follow. */}
      <Reveal className="investor-glass mt-12 rounded-2xl p-6 sm:p-10">
        <h2 className="text-xl font-semibold text-fg">{content.modelHeading}</h2>
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-end">
          <div>
            <label htmlFor={sliderId} className="block text-eyebrow font-semibold text-fg-subtle uppercase">
              {content.sliderLabel}
            </label>
            <p className="mt-3 text-display-sm font-semibold text-fg tabular-nums">{view.youAmount}</p>
          </div>
          <div>
            <input
              id={sliderId}
              type="range"
              className="round-range block h-11 w-full"
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              value={amount}
              aria-valuetext={view.youAmount}
              onChange={(e) => setChosen(Number(e.target.value))}
              style={{ '--round-fill': `${fill}%` } as CSSProperties}
            />
            <div aria-hidden className="flex justify-between text-sm text-fg-subtle tabular-nums">
              <span>{money(bounds.min)}</span>
              <span>{money(bounds.max)}</span>
            </div>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-micro font-semibold text-fg-subtle uppercase">{stat.label}</dt>
              <dd className="mt-2 text-2xl font-semibold text-fg tabular-nums sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* The small print, under the model as under The Raise. */}
      <Reveal className="mt-12 max-w-3xl">
        <p className="text-sm text-fg-subtle">{content.disclaimer}</p>
      </Reveal>
    </>
  );
}
