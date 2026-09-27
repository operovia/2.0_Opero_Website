import type { Viewport } from 'next';
import { themeCss } from '@/theme/css';
import { fontVariables } from '@/theme/fonts';
import { tokens } from '@/theme/tokens';
import './globals.css';

const designTokens = themeCss();

export const viewport: Viewport = {
  themeColor: tokens.color.dark.canvas,
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="dark" className={fontVariables}>
      <head>
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: designTokens }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
