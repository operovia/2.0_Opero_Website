'use client';

import { MoveHorizontal } from 'lucide-react';
import { useId, useState, type CSSProperties } from 'react';
import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { capTableCopy, capTableView, type CapTableConfig } from '@/lib/cap-table-math';
import { cn } from '@/lib/cn';

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
/** The test hooks of the first three holders' after-the-round figures, as the cap table handoff names them. */
const existingHooks = ['founder', 'flagship', 'pool'];

/** The bar's colors, read by .round-bar in globals.css; its width is the exact ownership, as a percentage. */
const barStyle = (jewel: JewelName, width: number) =>
  ({
    '--round-jewel': `var(--o-jewel-${jewel}-base)`,
    '--round-jewel-highlight': `var(--o-jewel-${jewel}-highlight)`,
    width: `${Math.min(100, Math.max(0, width))}%`,
  }) as CSSProperties;

function Dot({ jewel }: { jewel: JewelName }) {
  return <span aria-hidden className={cn('cap-dot', jewels[jewel])} />;
}

/** A holder's name with its jewel; on phones, where the Today column is hidden, today's share sits under the name. */
function Holder({ jewel, name, today }: { jewel: JewelName; name: string; today: string }) {
  return (
    <span className="cap-holder">
      <Dot jewel={jewel} />
      <span>
        {name}
        <span className="cap-today-m">{today}</span>
      </span>
    </span>
  );
}

/** A share of the company after the round: the percentage and the share count on one line, the bar below. */
function After({
  jewel,
  percent,
  shares,
  bar,
  you,
  hooks,
}: {
  jewel: JewelName;
  percent: string;
  shares: string;
  bar: number;
  you?: boolean;
  hooks?: { percent: string; shares?: string };
}) {
  return (
    <>
      <span className="cap-line">
        <span className={cn('cap-pct', you && 'cap-pct-you')} data-testid={hooks?.percent}>
          {percent}
        </span>
        <span className="cap-shares" data-testid={hooks?.shares}>
          {shares}
        </span>
      </span>
      <span aria-hidden className={cn('cap-bar', you && 'cap-bar-you')}>
        <span className="round-bar block h-full rounded-full" style={barStyle(jewel, bar)} />
      </span>
    </>
  );
}

/**
 * The Cap Table tab: the capitalization table today and after the round
 * converts, with the round inside it. A band at the head of the round says
 * what it is, and its bar is the investment slider: the teal part is the
 * reader's share of the round, the green the rest, and the hatching marks
 * the minimum. The reader's row and the rest of the round follow the slider,
 * and the notes and the small print stand under the table. Every figure
 * comes from the section's stored numbers through src/lib/cap-table-math.ts,
 * in exact whole-number arithmetic; the slider only chooses the amount. The
 * reference is the cap table handoff's mockup
 * (docs/reference/Cap_Table_Slider_Mockup.html). On phones the Class and
 * Today columns give way, and today's share sits under each holder's name.
 * Shown to guests and admins only; the round's terms stand on The Raise tab
 * (raise-terms.tsx).
 */
export function CapTableSection({ content }: Props) {
  const notesId = useId();
  const config: CapTableConfig = {
    holders: content.capTable,
    raise: content.raise,
    cap: content.cap,
    minimum: content.minimum,
    step: content.step,
    start: content.start,
  };
  const [chosen, setChosen] = useState(content.start);
  // Every figure comes from the math, for the amount it settles on (anything below the minimum is the minimum); never from the raw slider value.
  const view = capTableView(config, chosen);
  const copy = (text: string) => capTableCopy(text, view);
  const units = (count: string) => `${count} ${content.sharesUnit}`;
  const today = (percent: string) => `${content.todayColumn} ${percent}`;

  return (
    <Reveal className="mt-6">
      <div data-testid="cap-card" className="cap-card">
        <table className="cap-table" aria-describedby={notesId}>
          <caption className="sr-only">{content.capHeading}</caption>
          <colgroup>
            <col className="cap-col-holder" />
            <col className="cap-col-class" />
            <col className="cap-col-today" />
            <col className="cap-col-after" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{content.holderColumn}</th>
              <th scope="col" className="cap-class">
                {content.classColumn}
              </th>
              <th scope="col" className="cap-today">
                {content.todayColumn}
              </th>
              <th scope="col">{content.afterColumn}</th>
            </tr>
          </thead>

          <tbody>
            {view.existing.map((row, i) => {
              const jewel = existingJewels[i % existingJewels.length]!;
              const hook = existingHooks[i];
              return (
                <tr key={`${row.holder}-${i}`}>
                  <th scope="row">
                    <Holder jewel={jewel} name={row.holder} today={today(row.today)} />
                  </th>
                  <td className="cap-class">{row.class}</td>
                  <td className="cap-today">
                    <span className="cap-pct">{row.today}</span>
                  </td>
                  <td>
                    <After
                      jewel={jewel}
                      percent={row.after}
                      shares={units(row.shares)}
                      bar={row.bar}
                      hooks={hook ? { percent: `cap-after-pct-${hook}` } : undefined}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* The round: the band with the slider, then the reader and the rest of the round, on a tinted panel. */}
          <tbody className="cap-round">
            <tr className="cap-band">
              <td colSpan={4}>
                <div className="cap-band-top">
                  <p className="cap-band-title">
                    <span className="cap-eyebrow">{content.bandEyebrow}</span>
                    <span className="cap-band-size">{copy(content.bandLine)}</span>
                  </p>
                  <p aria-hidden className="cap-hint">
                    <MoveHorizontal className="size-4" />
                    <span>{content.bandHint}</span>
                  </p>
                </div>

                <div className="cap-split-labels">
                  <p className="cap-lab">
                    <Dot jewel="teal" />
                    <span>
                      {content.youLabel} <b data-testid="cap-you-amount">{view.youAmount}</b>
                    </span>
                    <span className="cap-sub" data-testid="cap-share-of-round">
                      {copy(content.youShare)}
                    </span>
                  </p>
                  <p className="cap-lab cap-lab-right">
                    {view.othersAmount ? (
                      <>
                        <span className="cap-lab-main">
                          {content.othersLabel} <b data-testid="cap-others-amount">{view.othersAmount}</b>
                        </span>
                        <span className="cap-sub">{content.othersRemaining}</span>
                      </>
                    ) : (
                      <span className="cap-lab-main">
                        <b>{content.fullyAllocated}</b>
                      </span>
                    )}
                    <Dot jewel="green" />
                  </p>
                </div>

                <div className="cap-split">
                  <span aria-hidden className="cap-track">
                    <span className="cap-track-you" style={{ width: `${view.split}%` }} />
                    <span className="cap-minzone" style={{ width: `${view.minimumAt}%` }} />
                  </span>
                  {/* A native range input over the bar, one thumb wider than it and shifted back by half a thumb, so the thumb's centre sits on the split at every value. */}
                  <input
                    type="range"
                    className="cap-range"
                    data-testid="cap-slider"
                    min={0}
                    max={content.raise}
                    step={content.step}
                    value={view.amount}
                    aria-label={content.sliderLabel}
                    aria-valuetext={copy(content.sliderValueText)}
                    aria-describedby={notesId}
                    onChange={(event) => setChosen(Number(event.target.value))}
                  />
                </div>
                <p className="cap-scale">
                  <span className="cap-tick" style={{ left: `${view.minimumAt}%` }}>
                    {copy(content.minimumLabel)}
                  </span>
                  <span className="cap-end">{view.roundAmount}</span>
                </p>
              </td>
            </tr>

            <tr className="cap-you">
              <th scope="row">
                <Holder jewel="teal" name={content.youLabel} today={today(view.todayNone)} />
              </th>
              <td className="cap-class" />
              <td className="cap-today">
                <span className="cap-pct">{view.todayNone}</span>
              </td>
              <td aria-live="polite">
                <After
                  jewel="teal"
                  percent={view.you.after}
                  shares={units(view.you.shares)}
                  bar={view.you.bar}
                  you
                  hooks={{ percent: 'cap-you-pct', shares: 'cap-you-shares' }}
                />
              </td>
            </tr>
            <tr className="cap-others">
              <th scope="row">
                <Holder jewel="green" name={content.othersLabel} today={today(view.todayNone)} />
              </th>
              <td className="cap-class" />
              <td className="cap-today">
                <span className="cap-pct">{view.todayNone}</span>
              </td>
              <td>
                <After
                  jewel="green"
                  percent={view.others.after}
                  shares={units(view.others.shares)}
                  bar={view.others.bar}
                  hooks={{ percent: 'cap-others-pct', shares: 'cap-others-shares' }}
                />
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <th scope="row" className="cap-total">
                {content.totalLabel}
              </th>
              <td className="cap-class" />
              <td className="cap-today">
                <span className="cap-line">
                  <span className="cap-pct">{view.totalToday.percent}</span>
                  <span className="cap-shares">{units(view.totalToday.shares)}</span>
                </span>
              </td>
              <td>
                <span className="cap-line">
                  <span className="cap-pct">{view.totalAfter.percent}</span>
                  <span className="cap-shares" data-testid="cap-total-after-shares">
                    {units(view.totalAfter.shares)}
                  </span>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* The notes the table and the slider refer to, then the small print. */}
      <div id={notesId} className="mt-6 max-w-3xl space-y-3 text-sm">
        <p className="text-fg-subtle">{content.capNote}</p>
        <p className="text-fg-subtle">{content.roundingNote}</p>
        <p className="pt-3 text-fg-subtle">{content.disclaimer}</p>
      </div>
    </Reveal>
  );
}
