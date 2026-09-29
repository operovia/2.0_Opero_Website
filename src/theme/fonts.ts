import localFont from 'next/font/local';

/**
 * Self-hosted brand type: Plus Jakarta Sans (SIL Open Font License, see
 * fonts/PlusJakartaSans-OFL.txt), variable files covering weights 200 to 800:
 * the supplied upright one, and the family's own italic (its Latin subset,
 * from the same open-source release) so italics are true italics, not slanted
 * upright letters. tokens.ts refers to the CSS variable only.
 */
export const jakarta = localFont({
  src: [
    { path: './fonts/PlusJakartaSans-Variable.woff2', style: 'normal', weight: '200 800' },
    { path: './fonts/PlusJakartaSans-Italic-Variable-Latin.woff2', style: 'italic', weight: '200 800' },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});

/** Class names that expose every font variable. Apply on <html>. */
export const fontVariables = jakarta.variable;
