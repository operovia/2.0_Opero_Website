import localFont from 'next/font/local';

/**
 * Self-hosted fonts. Placeholder: Inter (SIL Open Font License, see
 * fonts/Inter-OFL.txt) until the brand type specification arrives. To swap,
 * replace the files and paths here; tokens.ts refers to the CSS variable only.
 */
export const inter = localFont({
  src: [{ path: './fonts/inter-latin-opsz-normal.woff2', style: 'normal', weight: '100 900' }],
  variable: '--font-inter',
  display: 'swap',
});

/** Class names that expose every font variable. Apply on <html>. */
export const fontVariables = inter.variable;
