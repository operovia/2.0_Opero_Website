import localFont from 'next/font/local';

/**
 * Self-hosted brand type: Plus Jakarta Sans (SIL Open Font License, see
 * fonts/PlusJakartaSans-OFL.txt), one variable file covering weights 200 to
 * 800. tokens.ts refers to the CSS variable only.
 */
export const jakarta = localFont({
  src: [{ path: './fonts/PlusJakartaSans-Variable.woff2', style: 'normal', weight: '200 800' }],
  variable: '--font-jakarta',
  display: 'swap',
});

/** Class names that expose every font variable. Apply on <html>. */
export const fontVariables = jakarta.variable;
