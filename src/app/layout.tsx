import type { Metadata, Viewport } from 'next';
import { favicon } from '@/brand';
import { DoorVeil } from '@/components/door/door-veil';
import { themeCss } from '@/theme/css';
import { fontVariables } from '@/theme/fonts';
import { tokens } from '@/theme/tokens';
import './globals.css';

const designTokens = themeCss();

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: favicon.ico, sizes: 'any' },
      { url: favicon.svg, type: 'image/svg+xml' },
    ],
  },
};

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
      <body>
        {/* The front door's veil lives here, above every route, so it survives the crossing from /welcome to /. It renders nothing until a guest enters. */}
        <DoorVeil />
        {children}
      </body>
    </html>
  );
}
