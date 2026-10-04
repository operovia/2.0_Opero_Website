'use client';

import { useId, useState, type CSSProperties } from 'react';
import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { cn } from '@/lib/cn';
import { clampAmount, formatCount, formatMoney, formatPercent, formatPrice, roundModel, type CapRow } from '@/lib/round';

type Props = {
  /** The round section of the Data Room overview: the copy and the figures, from the server page. */
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

function jewelFor(row: CapRow, index: number): JewelName {
  if (row.kind === 'you') return 'teal';
  if (row.kind === 'others') return 'green';
  return existingJewels[index % existingJewels.length]!;
}

/** The bar's colors, read by .round-bar in globals.css. */
const barStyle = (jewel: JewelName, share: number) =>
  ({
    '--round-jewel': `var(--o-jewel-${jewel}-base)`,
    '--round-jewel-highlight': `var(--o-jewel-${jewel}-highlight)`,
    width: `${Math.min(100, Math.max(0, share * 100))}%`,
  }) as CSSProperties;

/**
 * The round: its terms in a row, what the investor gets, the investment
 * model (a slider and three figures), and the capitalization table today
 * and after the round converts. Every figure comes from the section's
 * stored numbers through src/lib/round.ts; the slider only chooses the
 * amount. Shown to guests and admins only.
 */
export function RoundSection({ content }: Props) {
  const sliderId = useId();
  const bounds = { min: content.minimum, max: content.maximum, step: content.step };
  const [chosen, setChosen] = useState(content.start);
  // The clamped figure drives everything, never the raw state.
  const amount = clampAmount(chosen, bounds);
  const model = roundModel({
    amount,
    raise: content.raise,
    cap: content.cap,
    holders: content.capTable,
    youLabel: content.youLabel,
    othersLabel: content.othersLabel,
  });
  const fill = bounds.max > bounds.min ? ((amount - bounds.min) / (bounds.max - bounds.min)) * 100 : 0;
  const totalAfter = model.totalToday + model.safeShares;

  const stats = [
    { label: content.shareLabel, value: formatPercent(model.shareOfRound, 2) },
    { label: content.ownershipLabel, value: formatPercent(model.ownership, 2) },
    { label: content.remainingLabel, value: formatMoney(model.remaining) },
  ];

  return (
    <>
      {/* The terms, one figure each. */}
      <Reveal delay={0.1}>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.terms.map((term, i) => (
            <li key={term.value + i} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <p className="text-2xl font-semibold text-fg tabular-nums">{term.value}</p>
              <p className="mt-1.5 text-sm text-fg-muted">{term.label}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-12 max-w-3xl">
        <h3 className="text-xl font-semibold text-fg">{content.getsHeading}</h3>
        <p className="mt-3 text-base text-fg-muted sm:text-lg">{content.getsBody}</p>
      </Reveal>

      {/* The model: the slider chooses the amount, the three figures follow. */}
      <Reveal className="investor-glass mt-12 rounded-2xl p-6 sm:p-10">
        <h3 className="text-xl font-semibold text-fg">{content.modelHeading}</h3>
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-end">
          <div>
            <label htmlFor={sliderId} className="block text-eyebrow font-semibold text-fg-subtle uppercase">
              {content.sliderLabel}
            </label>
            <p className="mt-3 text-display-sm font-semibold text-fg tabular-nums">{formatMoney(amount)}</p>
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
              aria-valuetext={formatMoney(amount)}
              onChange={(e) => setChosen(Number(e.target.value))}
              style={{ '--round-fill': `${fill}%` } as CSSProperties}
            />
            <div aria-hidden className="flex justify-between text-sm text-fg-subtle tabular-nums">
              <span>{formatMoney(bounds.min)}</span>
              <span>{formatMoney(bounds.max)}</span>
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

      {/* The capitalization table, today and after the round converts. */}
      <Reveal className="mt-12">
        <h3 className="text-xl font-semibold text-fg">{content.capHeading}</h3>
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
              {model.rows.map((row, i) => {
                const jewel = jewelFor(row, i);
                const you = row.kind === 'you';
                return (
                  <tr role="row" key={row.kind + row.holder + i} className={cn('block border-t border-line py-4 sm:table-row sm:py-0', you && 'font-semibold')}>
                    <th role="rowheader" scope="row" className="block pr-4 sm:table-cell sm:py-4 sm:align-top">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', jewels[jewel])} />
                        <span className={cn('text-base text-fg', you ? 'font-semibold' : 'font-medium')}>{row.holder}</span>
                      </span>
                      {row.class ? <span className="mt-0.5 block pl-5 text-sm font-normal text-fg-muted sm:hidden">{row.class}</span> : null}
                    </th>
                    <td role="cell" className="hidden pr-4 text-sm text-fg-muted sm:table-cell sm:py-4 sm:align-top">{row.class}</td>
                    <td role="cell" className="mt-3 flex items-baseline justify-between gap-4 pl-5 sm:mt-0 sm:table-cell sm:pr-4 sm:pl-0 sm:py-4 sm:align-top">
                      <span className="text-sm text-fg-subtle sm:hidden">{content.todayColumn}</span>
                      <span className="text-right sm:text-left">
                        <span className="block text-base text-fg tabular-nums">{formatPercent(row.today, 1)}</span>
                        {row.shares > 0 ? (
                          <span className="block text-sm font-normal text-fg-subtle tabular-nums">
                            {formatCount(row.shares)} {content.sharesUnit}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td role="cell" className="mt-2 block pl-5 sm:mt-0 sm:table-cell sm:py-4 sm:pl-0 sm:align-top">
                      <span className="flex items-baseline justify-between gap-4 sm:block">
                        <span className="text-sm text-fg-subtle sm:hidden">{content.afterColumn}</span>
                        <span className="text-right sm:text-left">
                          <span className="block text-base text-fg tabular-nums">{formatPercent(row.after, 1)}</span>
                          <span className="block text-sm font-normal text-fg-subtle tabular-nums">
                            {formatCount(row.sharesAfter)} {content.sharesUnit}
                          </span>
                        </span>
                      </span>
                      <span aria-hidden className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <span className="round-bar block h-full rounded-full" style={barStyle(jewel, row.after)} />
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
                    {formatPercent(1, 1)}
                    <span className="block text-fg-subtle">
                      {formatCount(model.totalToday)} {content.sharesUnit}
                    </span>
                  </span>
                </td>
                <td role="cell" className="mt-2 flex items-baseline justify-between gap-4 sm:mt-0 sm:table-cell sm:py-4">
                  <span className="text-fg-subtle sm:hidden">{content.afterColumn}</span>
                  <span className="text-right tabular-nums sm:text-left">
                    {formatPercent(1, 1)}
                    <span className="block text-fg-subtle">
                      {formatCount(totalAfter)} {content.sharesUnit}
                    </span>
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-4 text-sm text-fg-muted">
          {content.priceLabel}: <span className="font-medium text-fg tabular-nums">{formatPrice(model.price)}</span>
        </p>
        <p className="mt-3 max-w-3xl text-sm text-fg-subtle">{content.capNote}</p>
      </Reveal>
    </>
  );
}
