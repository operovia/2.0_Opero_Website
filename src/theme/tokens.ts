/**
 * Design tokens: the single source for every color, font, radius, shadow,
 * spacing, type, and motion value in the product.
 *
 * Components never hardcode these values. They use Tailwind utilities that
 * are generated from these tokens (see src/app/globals.css) or the CSS
 * variables written by src/theme/css.ts. Emails and generated images import
 * this file directly.
 *
 * Source: colors are taken from the supplied artwork in public/brand (the
 * wordmark's metal gradients, the five jewels, and the favicon ground). The
 * written color and type specification has not arrived yet; when it does,
 * adjust values here and nothing else should need to change.
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
  /** Primary action color: the wordmark's silver on dark, its charcoal on light. */
  accent: string;
  accentHover: string;
  /** Text and icons placed on top of `accent`. */
  onAccent: string;
  /** Tinted background for highlighted chips and rows. */
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

/** A jewel's radial gradient stops, lightest to deepest, as drawn in the Opero mark. */
export type JewelStops = readonly [highlight: string, base: string, shade: string, deep: string];

export type Jewel = { dark: JewelStops; light: JewelStops };

/** The five jewels, in the order they sit under the Opero wordmark. */
const jewels = {
  crimson: {
    dark: ['#D2696C', '#A63F44', '#8A2930', '#6B1C22'],
    light: ['#B2484E', '#841C28', '#6A0A1A', '#4E040F'],
  },
  violet: {
    dark: ['#9878CC', '#7050A0', '#583A86', '#412968'],
    light: ['#7A59AC', '#533180', '#3E1C66', '#2C1049'],
  },
  gold: {
    dark: ['#D9A55E', '#AF843B', '#916C28', '#74521B'],
    light: ['#BC8F42', '#8F6512', '#754E00', '#553800'],
  },
  green: {
    dark: ['#63B08A', '#3A8864', '#24704E', '#16563A'],
    light: ['#41946E', '#116947', '#005130', '#003A22'],
  },
  teal: {
    dark: ['#5FA8BF', '#367F95', '#206678', '#144E5D'],
    light: ['#3E89A0', '#0C6076', '#00485B', '#003341'],
  },
} as const satisfies Record<string, Jewel>;

export type JewelName = keyof typeof jewels;

export const tokens = {
  color: {
    dark: {
      canvas: '#0F1115',
      canvasRaised: '#13161B',
      surface: '#171A1F',
      surfaceRaised: '#1E2127',
      line: '#272A31',
      lineStrong: '#363A42',
      lineInput: '#6A6F79',
      fg: '#F2F4F6',
      fgMuted: '#B3B8C0',
      fgSubtle: '#8E939C',
      accent: '#E6E9EC',
      accentHover: '#FFFFFF',
      onAccent: '#0F1115',
      accentSoft: '#F2F4F614',
      focusRing: '#5FA8BF',
      success: '#63B08A',
      successSoft: '#63B08A1F',
      warning: '#D9A55E',
      warningSoft: '#D9A55E1F',
      danger: '#E3787B',
      dangerSoft: '#D2696C24',
      overlay: '#08090BCC',
    },
    light: {
      canvas: '#FFFFFF',
      canvasRaised: '#F6F7F8',
      surface: '#FFFFFF',
      surfaceRaised: '#F2F3F5',
      line: '#E3E5E8',
      lineStrong: '#CDD0D5',
      lineInput: '#868A93',
      fg: '#25272E',
      fgMuted: '#50545E',
      fgSubtle: '#656973',
      accent: '#25272E',
      accentHover: '#3E424C',
      onAccent: '#FFFFFF',
      accentSoft: '#25272E0F',
      focusRing: '#0C6076',
      success: '#116947',
      successSoft: '#11694714',
      warning: '#754E00',
      warningSoft: '#8F651214',
      danger: '#841C28',
      dangerSoft: '#841C2814',
      overlay: '#25272E66',
    },
  } satisfies Record<ThemeName, ThemeColors>,

  brand: {
    /**
     * The wordmark's metal: a vertical gradient, top to bottom, as
     * [offset, color] pairs. Used for display type.
     */
    metal: {
      dark: [
        ['0%', '#F2F4F6'],
        ['24%', '#CFD3D8'],
        ['52%', '#A9AEB6'],
        ['80%', '#C6CBD1'],
        ['100%', '#E6E9EC'],
      ],
      light: [
        ['0%', '#5A5E68'],
        ['22%', '#3E4350'],
        ['48%', '#25272E'],
        ['78%', '#33363F'],
        ['100%', '#3E424C'],
      ],
    },
    jewels,
    /**
     * Lighting layered over every jewel, taken from the jewels in the full
     * Opero mark (opero-dark.svg and opero-light.svg). The small and flat
     * exports of the mark leave these out.
     */
    jewelLight: {
      /** The crisp highlight dot (82% white). */
      specular: '#FFFFFFD1',
      /** The soft glow around the highlight (52% white). */
      glow: '#FFFFFF85',
      /** Faint light bouncing back at the lower right (10% white). */
      rim: '#FFFFFF1A',
      /** Shading that deepens toward the edge (22% black; 30% on light backgrounds). */
      edge: { dark: '#00000038', light: '#0000004D' },
      /** The fine ring just inside the jewel's outline (12% black; 16% on light backgrounds). */
      ring: { dark: '#0000001F', light: '#00000029' },
    },
    /**
     * Oppie's mark, from the supplied artwork (public/brand/oppie): a pie of
     * five slices in module colors, clockwise from the top in brand order.
     * Each slice is a radial gradient from highlight through base to shadow,
     * under a white shine.
     */
    oppie: {
      slices: {
        build: ['#FF5444', '#D43A2F', '#83241D'],
        studios: ['#9B5BE8', '#6B3FA0', '#422763'],
        playbook: ['#FFCA26', '#C58B1A', '#7A5610'],
        university: ['#44CF84', '#2F8F5B', '#1D5938'],
        compass: ['#2CCEDF', '#1E8E9A', '#13585F'],
      },
      /** The shine: white, fading out from each slice's lit corner. */
      shine: {
        color: '#FFFFFF',
        stops: [
          { offset: 0, opacity: 0.6 },
          { offset: 0.45, opacity: 0.1 },
          { offset: 1, opacity: 0 },
        ],
      },
      /** The halo that breathes around the mark at rest. */
      halo: { dark: { color: '#FFFFFF', opacity: 0.35 }, light: { color: '#6B3FA0', opacity: 0.25 } },
      /** The shadow under the pie, in the mark's own units (it is 160 wide). */
      shadow: {
        dark: { color: '#000000', opacity: 0.5, blur: 5, offset: 3 },
        light: { color: '#000000', opacity: 0.18, blur: 3, offset: 3 },
      },
      /** How much brighter a slice gets as the thinking relay reaches it. */
      litBrightness: 1.35,
    },
    /** Aurora background: the jewels' base colors and how strongly they show per theme. */
    aurora: {
      colors: [jewels.violet.dark[1], jewels.teal.dark[1], jewels.crimson.dark[1], jewels.green.dark[1], jewels.gold.dark[1]],
      opacity: { dark: 0.5, light: 0.16 },
    },
  },

  /**
   * Which jewel each module wears, confirmed by the brand owner: the jewels
   * under the wordmark read left to right as Build, Studios, Playbook,
   * University, Compass. Keys are listed in that brand order.
   */
  modules: {
    build: 'crimson',
    studios: 'violet',
    playbook: 'gold',
    university: 'green',
    compass: 'teal',
  } satisfies Record<string, JewelName>,

  font: {
    /** Plus Jakarta Sans, self-hosted. `--font-jakarta` comes from next/font (src/theme/fonts.ts). */
    sans: 'var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    display: 'var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
    weight: {
      normal: '400',
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
    sm: { size: '0.875rem', lineHeight: '1.6', tracking: '0.005em' },
    base: { size: '1rem', lineHeight: '1.7', tracking: '0em' },
    lg: { size: '1.125rem', lineHeight: '1.72', tracking: '0em' },
    xl: { size: '1.3125rem', lineHeight: '1.62', tracking: '0em' },
    '2xl': { size: '1.625rem', lineHeight: '1.38', tracking: '0em' },
    '3xl': { size: '2rem', lineHeight: '1.28', tracking: '0.002em' },
    'display-sm': { size: 'clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem)', lineHeight: '1.22', tracking: '0.004em' },
    'display-md': { size: 'clamp(2.25rem, 1.5rem + 2.9vw, 3.75rem)', lineHeight: '1.18', tracking: '0.006em' },
    'display-lg': { size: 'clamp(2.5rem, 1.65rem + 3.2vw, 4.25rem)', lineHeight: '1.14', tracking: '0.008em' },
    /** Small uppercase labels: eyebrows, console tags. */
    eyebrow: { size: '0.8125rem', lineHeight: '1.4', tracking: '0.16em' },
    /** The smallest uppercase labels, such as the console's badge and footer. */
    micro: { size: '0.6875rem', lineHeight: '1.4', tracking: '0.16em' },
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
      lg: '0 30px 80px -24px #000000B3, 0 0 0 1px #FFFFFF0F',
      glow: '0 0 0 1px #F2F4F61F, 0 18px 60px -18px #5FA8BF40',
    },
    light: {
      sm: '0 1px 2px #25272E14',
      md: '0 8px 24px -10px #25272E29, 0 0 0 1px #25272E0D',
      lg: '0 28px 70px -24px #25272E3D, 0 0 0 1px #25272E0F',
      glow: '0 0 0 1px #25272E14, 0 18px 50px -18px #0C607640',
    },
  },

  space: {
    /** Base unit for Tailwind's spacing scale (p-4 is 4 units). */
    unit: '0.25rem',
    /** Horizontal page gutter. */
    gutter: 'clamp(1.25rem, 0.8rem + 2vw, 2.5rem)',
    /** Vertical padding for a full page section. */
    section: 'clamp(4.5rem, 3rem + 5vw, 7.5rem)',
    /** Max width of page content. */
    container: '76rem',
    /** Max width of a readable text column. */
    prose: '42rem',
    /** Width scale for cards, dialogs, and columns (Tailwind's max-w-sm and so on). */
    widths: {
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      '4xl': '56rem',
      '5xl': '64rem',
      '6xl': '72rem',
    },
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
    /** Oppie's motion, from the supplied mark: one breath at rest, one round of the relay while thinking. */
    oppie: {
      idle: 2400,
      thinking: 2000,
      ease: [0.42, 0, 0.58, 1],
    },
  },
} as const;

export type ModuleKey = keyof typeof tokens.modules;

/** A module's jewel stops for the given theme. */
export function moduleJewel(module: ModuleKey, theme: ThemeName = 'dark'): JewelStops {
  return tokens.brand.jewels[tokens.modules[module]][theme];
}
