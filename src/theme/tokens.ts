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
  /** The "in" of the LinkedIn icon: LinkedIn's blue on light, a lighter tint of it on dark so it stays clear on a dark tile. */
  linkedin: string;
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
      linkedin: '#378FE9',
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
      linkedin: '#0A66C2',
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
     * Oppie's mark, from the owner's handoff (docs/brand/oppie-8e-handoff.md):
     * five rounded pills standing side by side, one per module in brand order,
     * tallest in the middle like a voice level. Each is a deep jewel tone at
     * the top fading into a shared graphite base. Units are the mark's own: it
     * is 100 square.
     */
    oppie: {
      /** Each pill's left edge and height. All are the same width, fully rounded, and centered at y 50. */
      pills: [
        { module: 'build', x: 10, height: 36 },
        { module: 'studios', x: 27, height: 60 },
        { module: 'playbook', x: 44, height: 80 },
        { module: 'university', x: 61, height: 60 },
        { module: 'compass', x: 78, height: 36 },
      ],
      width: 12,
      /**
       * Each pill's curved surface, left to right across it, at `surfaceStops`:
       * shadow, the jewel tone, the lit face, the jewel tone, shadow. Dark
       * backgrounds get brighter tones so the purple stays visible.
       */
      surface: {
        light: {
          build: ['#5C130F', '#A8231C', '#F43329', '#A8231C', '#4C100D'],
          studios: ['#291348', '#4B2382', '#6D33BD', '#4B2382', '#22103B'],
          playbook: ['#5C3D07', '#A86F0C', '#F4A111', '#A86F0C', '#4C3205'],
          university: ['#103B25', '#1D6B43', '#2A9B61', '#1D6B43', '#0D301E'],
          compass: ['#0A3B42', '#136C78', '#1C9DAE', '#136C78', '#093136'],
        },
        dark: {
          build: ['#6E1D17', '#C8342A', '#FF4B3D', '#C8342A', '#5A1713'],
          studios: ['#402765', '#7446B8', '#A866FF', '#7446B8', '#342053'],
          playbook: ['#6E4C0E', '#C88A1A', '#FFC826', '#C88A1A', '#5A3E0C'],
          university: ['#174C30', '#2A8A58', '#3DC880', '#2A8A58', '#133E28'],
          compass: ['#104D55', '#1D8C9A', '#2ACBDF', '#1D8C9A', '#0D3F45'],
        },
      },
      surfaceStops: [0, 0.18, 0.42, 0.7, 1],
      /** The graphite every pill fades into at its foot. */
      graphite: { light: '#23262B', dark: '#3A3D45' },
      /** Top to bottom over the surface: white light at the top, clear through the middle, graphite at the foot. */
      depth: { lightTop: { color: '#FFFFFF', opacity: 0.25, until: 0.3 }, graphiteFrom: 0.7, graphiteOpacity: 0.85 },
      /** The black that darkens a pill's side as it turns edge-on. */
      shade: '#000000',
      /** The white highlight down each pill: how far in from its left edge and ends, how wide, how bright. */
      glint: { left: 4, inset: 3, width: 2.6, color: '#FFFFFF', opacity: 0.55 },
      /** The fine outline just inside each pill. */
      rim: { light: { color: '#000000', opacity: 0.2 }, dark: { color: '#FFFFFF', opacity: 0.22 } },
      /**
       * Finer details for a mark shown big (120px and up), where the icon-size
       * highlight and outline read heavy: a thin highlight that fades out down
       * the pill, like light on glass, and an edge lit only across the top.
       * The owner's adjustment to the handoff's artwork, for big marks only.
       */
      large: {
        glint: {
          left: 4.4,
          inset: 3.5,
          width: 1.2,
          stops: [
            { offset: 0, opacity: 0 },
            { offset: 0.1, opacity: 0.75 },
            { offset: 0.45, opacity: 0.25 },
            { offset: 0.8, opacity: 0 },
          ],
        },
        rim: {
          width: 0.4,
          stops: [
            { offset: 0, opacity: 0.3 },
            { offset: 0.3, opacity: 0.05 },
            { offset: 1, opacity: 0.1 },
          ],
        },
      },
    },
    /** Aurora background: the jewels' base colors and how strongly they show per theme. */
    aurora: {
      colors: [jewels.violet.dark[1], jewels.teal.dark[1], jewels.crimson.dark[1], jewels.green.dark[1], jewels.gold.dark[1]],
      opacity: { dark: 0.5, light: 0.16 },
    },
    /** The front door (src/components/door): how much of the text color lights the point's soft glow and the veil's ring of light, in percent. */
    door: {
      glow: 14,
      band: 40,
    },
    /**
     * The iPhone the OperoGo screens stand in (src/components/site/home/phone-frame.tsx):
     * the black glass around the screen, which the Dynamic Island is cut from,
     * and the front camera in the island, a dark lens with a faint glint. The
     * same on both themes, since a phone is an object, not a surface. Its band
     * and buttons are the wordmark's metal under `bandShade` (28% black), so
     * they read as titanium rather than a bright ring.
     */
    phone: {
      glass: '#000000',
      lens: '#121A26',
      glint: '#33445C',
      bandShade: '#00000047',
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
    /** Mr Dafoe, self-hosted, for the founder's signature only. `--font-signature` comes from next/font (src/theme/fonts.ts). */
    signature: 'var(--font-signature), cursive',
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
    /** A single figure set very large, such as the founder's years on the Investor Hub. */
    numeral: { size: 'clamp(5.5rem, 3.4rem + 7vw, 9.5rem)', lineHeight: '1', tracking: '0.01em' },
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
    /**
     * The platform section's network (src/components/site/home/platform-network.tsx):
     * `delay` after it comes into view, light leaves Oppie and runs `across`
     * the line joining the modules to each end; as it passes a module's line
     * it runs up to the CRM and down to the module, taking `reach`.
     */
    links: {
      delay: 500,
      across: 1000,
      reach: 600,
    },
    /**
     * Oppie's flip (docs/brand/oppie-8e-handoff.md): while Oppie thinks, each
     * pill turns over once per `turn`, starting `stagger` after the one before
     * it, so the turn ripples left to right. A mark that greets turns over once
     * when it comes into view, after `greetDelay`, so it has faded in first.
     */
    oppie: {
      turn: 1600,
      stagger: 160,
      greetDelay: 400,
      /** At the owner's request, a mark that keeps a light on (`flicker`) dims as far as `flickerLow` and back at uneven moments over each `flicker`, like a pilot light. */
      flicker: 6400,
      flickerLow: 0.72,
    },
    /**
     * The front door (src/components/door): on arrival the point of light
     * comes up over `point` and the mark settles by `settle` over `mark`; the
     * door's pieces rise and sink by `lift`. The checking light runs at most
     * `runs` times before it holds. After a yes, the spark returns at
     * `sparkScale` of its size and flares to `flareScale` over `flare`, the
     * ring of light grows from `irisFrom` to `irisScale` times its size while
     * it fades from `irisOpacity`, and the aurora blooms from `bloomScale`,
     * both over `iris`; then the
     * darkness lifts over `veil`, the home page is released at `release` of
     * the lift, and after `giveUp` without the home page the veil falls back
     * to a plain navigation. (The action's answer floor is DOOR_FLOOR_MS in
     * src/server/guests.ts.)
     */
    door: {
      point: 300,
      mark: 900,
      settle: 6,
      lift: 8,
      runs: 3,
      sparkScale: 0.5,
      flareScale: 4,
      flare: 500,
      iris: 1200,
      irisFrom: 0.1,
      irisScale: 10,
      irisOpacity: 0.8,
      bloomScale: 0.3,
      veil: 1000,
      release: 0.5,
      giveUp: 6000,
    },
  },
} as const;

export type ModuleKey = keyof typeof tokens.modules;

/** A module's jewel stops for the given theme. */
export function moduleJewel(module: ModuleKey, theme: ThemeName = 'dark'): JewelStops {
  return tokens.brand.jewels[tokens.modules[module]][theme];
}
