import { BrandMark } from '@/components/brand/brand-mark';
import { RichText } from '@/components/rich-text';
import type { SectionData } from '@/content/registry';
import { LetterDialog } from './letter-dialog';

/**
 * The founder's letter, behind the Read My Story button under the headline at
 * the top of the Data Room overview and the Founder page: the title, the letter, and
 * the close, signed by hand in the signature face above the name and role,
 * with the Operovia logo beneath, as on the company's letterhead.
 */
export function FounderLetter({ letter }: { letter: SectionData<'investors', 'letter'> }) {
  return (
    <LetterDialog label={letter.buttonLabel}>
      <h2 id="founder-letter-title" className="text-display-sm font-medium text-metal">
        {letter.title}
      </h2>
      {letter.date ? <p className="mt-3 text-sm text-fg-subtle">{letter.date}</p> : null}
      <RichText doc={letter.body} className="mt-8 text-lg text-fg" />
      <div className="mt-12">
        <p className="ps-4 font-signature text-display-lg leading-none text-fg">{letter.signature}</p>
        <p className="mt-6 text-base font-semibold text-fg">{letter.name}</p>
        <p className="mt-1 text-eyebrow font-semibold text-fg-subtle uppercase">{letter.role}</p>
        <BrandMark name="operovia" className="mt-6 h-7" />
      </div>
    </LetterDialog>
  );
}
