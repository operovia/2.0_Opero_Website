import { Reveal } from '@/components/motion/reveal';
import type { SectionData } from '@/content/registry';
import { fillRoundFigures } from '@/lib/round-figures';

/**
 * The round's terms, one figure each, and what the investor gets: the top of
 * The Raise. The round, the cap and the minimum read from the same saved
 * numbers as the Cap Table tab (cap-table.tsx), through the tokens in the
 * copy ({round}, {cap}, {minimum}, {cap in millions}), so the two tabs
 * always agree.
 */
export function RaiseTerms({ content }: { content: SectionData<'investors', 'round'> }) {
  const fill = (text: string) => fillRoundFigures(text, content);
  return (
    <>
      <Reveal delay={0.1}>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.terms.map((term, i) => (
            <li key={term.value + i} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <p className="text-2xl font-semibold text-fg tabular-nums">{fill(term.value)}</p>
              <p className="mt-1.5 text-sm text-fg-muted">{fill(term.label)}</p>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold text-fg">{content.getsHeading}</h2>
        <p className="mt-3 text-base text-fg-muted sm:text-lg">{fill(content.getsBody)}</p>
      </Reveal>
    </>
  );
}
