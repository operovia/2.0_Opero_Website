/**
 * Design tokens: the single source for every color, font, radius, shadow,
 * spacing, type, and motion value in the product.
 *
 * Components never hardcode these values. They use Tailwind utilities that
 * are generated from these tokens (see src/app/globals.css) or the CSS
 * variables written by src/theme/css.ts. Emails and generated images import
 * this file directly.
 *
 * PLACEHOLDER THEME: every value below is a neutral stand-in until the brand
 * color and type specification arrives. Swap values here; nothing else
 * should need to change.
 */

export type ThemeName = 'dark' | 'light';

/** Colors that change between light and dark themes. */
export type ThemeColors = {
  /** Page background. */
  canvas: string;
  /** Slightly raised page band, for alternating sections. */
  canvasRaised: string;
  /** Cards, panels, inputs. */
  surface: string;
  /** Raised elements on top of a surface: menus, popovers, hovered rows. */
  surfaceRaised: string;
  /** Hairlines and dividers. */
  line: string;
  lineStrong: string;
  /** Borders that identify form controls. Must meet 3:1 against surface and canvas. */
  lineInput: string;
  /** Primary text. */
  fg: string;
  /** Secondary text. Must meet WCAG AA (4.5:1) on canvas and surface. */
  fgMuted: string;
  /** Tertiary text for captions and metadata. Must meet 4.5:1 on canvas. */
  fgSubtle: string;
  accent: string;
  accentHover: string;
  /** Text and icons placed on top of `accent`. */
  onAccent: string;
  /** Tinted background for accent-colored chips and highlights. */
  accentSoft: string;
  focusRing: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  /** Translucent veil behind dialogs. */
  overlay: string;
};

export const tokens = {
  color: {
    dark: {
      canvas: '#0B0D12',
      canvasRaised: '#0F1219',
      surface: '#151923',
      surfaceRaised: '#1C2130',
      line: '#252B38',
      lineStrong: '#363E4F',
      lineInput: '#626C82',
      fg: '#F1F3F7',
      fgMuted: '#AAB2C0',
      fgSubtle: '#8A93A3',
      accent: '#8FA8FF',
      accentHover: '#A8BCFF',
      onAccent: '#0B0D12',
      accentSoft: '#8FA8FF1F',
      focusRing: '#A8BCFF',
      success: '#5FD68E',
      successSoft: '#5FD68E1F',
      warning: '#F2C14E',
      warningSoft: '#F2C14E1F',
      danger: '#FF8A8A',
      dangerSoft: '#FF8A8A1F',
      overlay: '#05060ACC',
    },
    light: {
      canvas: '#FFFFFF',
      canvasRaised: '#F5F6F8',
      surface: '#FFFFFF',
      surfaceRaised: '#F4F5F8',
      line: '#E2E5EA',
      lineStrong: '#C9CFD8',
      lineInput: '#858E9C',
      fg: '#0E1116',
      fgMuted: '#4A5363',
      fgSubtle: '#636C7C',
      accent: '#3651C9',
      accentHover: '#2C44AD',
      onAccent: '#FFFFFF',
      accentSoft: '#3651C914',
      focusRing: '#3651C9',
      success: '#1E7F4A',
      successSoft: '#1E7F4A14',
      warning: '#8A5A00',
      warningSoft: '#8A5A0014',
      danger: '#B42323',
      dangerSoft: '#B4232314',
      overlay: '#0E111666',
    },
  } satisfies Record<ThemeName, ThemeColors>,

  /**
   * Brand palette. Drives the aurora background and decorative gradients.
   * Placeholder hues until the brand palette arrives.
   */
  palette: {
    aurora: ['#3D5BD9', '#14A38B', '#6E4ADB'],
    /** Opacity of the aurora layer in each theme. */
    auroraOpacity: { dark: 0.55, light: 0.22 },
  },

  /** Accent color for each platform module (placeholders). */
  modules: {
    studios: '#5C7CFA',
    playbook: '#20C997',
    university: '#FAB005',
    compass: '#F06595',
    build: '#9775FA',
  },

  font: {
    /** Body and interface text. `--font-inter` comes from next/font (src/theme/fonts.ts). */
    sans: 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    /** Headlines. Same family as body until the brand type specification arrives. */
    display: 'var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  /**
   * Type scale. Headlines stay open: generous line height and neutral or
   * slightly positive tracking, never condensed. Display sizes are fluid.
   */
  text: {
    xs: { size: '0.75rem', lineHeight: '1.5', tracking: '0.01em' },
    sm: { size: '0.875rem', lineHeight: '1.55', tracking: '0.005em' },
    base: { size: '1rem', lineHeight: '1.65', tracking: '0em' },
    lg: { size: '1.125rem', lineHeight: '1.7', tracking: '0em' },
    xl: { size: '1.3125rem', lineHeight: '1.6', tracking: '0em' },
    '2xl': { size: '1.625rem', lineHeight: '1.35', tracking: '0em' },
    '3xl': { size: '2rem', lineHeight: '1.25', tracking: '0em' },
    'display-sm': { size: 'clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem)', lineHeight: '1.2', tracking: '0.002em' },
    'display-md': { size: 'clamp(2.25rem, 1.5rem + 2.9vw, 3.75rem)', lineHeight: '1.16', tracking: '0.004em' },
    'display-lg': { size: 'clamp(2.625rem, 1.6rem + 4.2vw, 5rem)', lineHeight: '1.12', tracking: '0.006em' },
    /** Small uppercase labels: eyebrows, console tags. */
    eyebrow: { size: '0.8125rem', lineHeight: '1.4', tracking: '0.14em' },
  },

  radius: {
    xs: '0.375rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },

  /** Shadows per theme. Dark shadows lean on subtle light edges instead of heavy blur. */
  shadow: {
    dark: {
      sm: '0 1px 2px #00000066',
      md: '0 8px 24px -8px #0000008C, 0 0 0 1px #FFFFFF0A',
      lg: '0 24px 64px -16px #000000A6, 0 0 0 1px #FFFFFF0F',
      glow: '0 0 0 1px #8FA8FF33, 0 12px 48px -12px #8FA8FF59',
    },
    light: {
      sm: '0 1px 2px #0E11160F',
      md: '0 8px 24px -10px #0E111626, 0 0 0 1px #0E11160A',
      lg: '0 24px 64px -20px #0E111633, 0 0 0 1px #0E11160D',
      glow: '0 0 0 1px #3651C926, 0 12px 40px -12px #3651C940',
    },
  },

  space: {
    /** Base unit for Tailwind's spacing scale (p-4 is 4 units). */
    unit: '0.25rem',
    /** Horizontal page gutter. */
    gutter: 'clamp(1.25rem, 0.8rem + 2vw, 2.5rem)',
    /** Vertical padding for a full page section. */
    section: 'clamp(5rem, 3.5rem + 7vw, 9.5rem)',
    /** Max width of page content. */
    container: '76rem',
    /** Max width of a readable text column. */
    prose: '42rem',
  },

  motion: {
    duration: {
      fast: 150,
      base: 240,
      slow: 420,
      reveal: 800,
    },
    /** Cubic bezier control points, usable in CSS and in Motion. */
    ease: {
      standard: [0.2, 0, 0, 1],
      out: [0.16, 1, 0.3, 1],
      inOut: [0.65, 0, 0.35, 1],
    },
    /** Distance revealed elements travel, in pixels. */
    revealDistance: 24,
  },
} as const;

export type ModuleKey = keyof typeof tokens.modules;
