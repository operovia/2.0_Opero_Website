import { tokens, type JewelStops, type ThemeColors, type ThemeName } from './tokens';

/**
 * Turns the design tokens into CSS custom properties. The root layout inlines
 * the result in <head>, and src/app/globals.css maps Tailwind utilities onto
 * these variables, so tokens.ts stays the single source of every value.
 */

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const cubic = (points: readonly number[]) => `cubic-bezier(${points.join(', ')})`;

function declarations(entries: Record<string, string | number>): string {
  return Object.entries(entries)
    .map(([name, value]) => `--o-${name}: ${value};`)
    .join('');
}

/** The wordmark's vertical metal gradient. */
function metalGradient(theme: ThemeName): string {
  const stops = tokens.brand.metal[theme].map(([offset, color]) => `${color} ${offset}`);
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

/**
 * A jewel as layered CSS gradients, drawn layer for layer like the jewels in
 * the full Opero mark (public/brand/opero/opero-dark.svg): from the top, the
 * crisp highlight dot, its soft glow, the fine ring inside the outline, rim
 * light, edge shading, and the colored body. Every position and size is the
 * mark's own, as a share of the jewel's width, so a jewel of any size matches
 * the logo. The crisp dot and the ring are what make it read as polished.
 */
function jewelGradient([highlight, base, shade, deep]: JewelStops, theme: ThemeName): string {
  const { specular, glow, rim, edge, ring } = tokens.brand.jewelLight;
  return [
    `radial-gradient(6% 6% at 31% 26%, ${specular} 80%, transparent 100%)`,
    `radial-gradient(18% 15.5% at 33% 26.5%, ${glow} 0%, transparent 100%)`,
    `radial-gradient(circle closest-side, transparent 94%, ${ring[theme]} 96%)`,
    `radial-gradient(40% 40% at 74% 82%, ${rim} 0%, transparent 100%)`,
    `radial-gradient(86% 86% at 30% 24%, transparent 55%, ${edge[theme]} 100%)`,
    `radial-gradient(103.3% 103.3% at 30% 24%, ${highlight} 0%, ${base} 38%, ${shade} 72%, ${deep} 100%)`,
  ].join(', ');
}

function themeDeclarations(theme: ThemeName): string {
  const colors: ThemeColors = tokens.color[theme];
  const vars: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(colors)) vars[kebab(key)] = value;
  for (const [key, value] of Object.entries(tokens.shadow[theme])) vars[`shadow-${key}`] = value;

  vars['metal'] = metalGradient(theme);
  vars['jewel-light-specular'] = tokens.brand.jewelLight.specular;
  vars['jewel-light-edge'] = tokens.brand.jewelLight.edge[theme];
  vars['aurora-opacity'] = tokens.brand.aurora.opacity[theme];

  for (const [name, jewel] of Object.entries(tokens.brand.jewels)) {
    vars[`jewel-${name}`] = jewelGradient(jewel[theme], theme);
    vars[`jewel-${name}-base`] = jewel[theme][1];
    vars[`jewel-${name}-highlight`] = jewel[theme][0];
  }
  for (const [module, jewel] of Object.entries(tokens.modules)) {
    vars[`module-${module}`] = `var(--o-jewel-${jewel})`;
    vars[`module-${module}-base`] = `var(--o-jewel-${jewel}-base)`;
    vars[`module-${module}-highlight`] = `var(--o-jewel-${jewel}-highlight)`;
  }

  return `color-scheme: ${theme};${declarations(vars)}`;
}

function sharedDeclarations(): string {
  const vars: Record<string, string | number> = {};

  tokens.brand.aurora.colors.forEach((color, i) => (vars[`aurora-${i + 1}`] = color));

  vars['font-sans'] = tokens.font.sans;
  vars['font-display'] = tokens.font.display;
  vars['font-mono'] = tokens.font.mono;
  for (const [key, value] of Object.entries(tokens.font.weight)) vars[`weight-${key}`] = value;

  for (const [key, value] of Object.entries(tokens.text)) {
    vars[`text-${key}`] = value.size;
    vars[`text-${key}-lh`] = value.lineHeight;
    vars[`text-${key}-tracking`] = value.tracking;
  }

  for (const [key, value] of Object.entries(tokens.radius)) vars[`radius-${key}`] = value;

  vars['space-unit'] = tokens.space.unit;
  vars['gutter'] = tokens.space.gutter;
  vars['section'] = tokens.space.section;
  vars['container'] = tokens.space.container;
  vars['prose'] = tokens.space.prose;
  for (const [key, value] of Object.entries(tokens.space.widths)) vars[`width-${key}`] = value;

  for (const [key, value] of Object.entries(tokens.motion.duration)) vars[`duration-${key}`] = `${value}ms`;
  for (const [key, value] of Object.entries(tokens.motion.ease)) vars[`ease-${kebab(key)}`] = cubic(value);
  vars['reveal-distance'] = `${tokens.motion.revealDistance}px`;
  vars['oppie-turn'] = `${tokens.motion.oppie.turn}ms`;
  vars['oppie-stagger'] = `${tokens.motion.oppie.stagger}ms`;
  vars['oppie-greet-delay'] = `${tokens.motion.oppie.greetDelay}ms`;
  vars['oppie-flicker'] = `${tokens.motion.oppie.flicker}ms`;
  vars['oppie-flicker-low'] = String(tokens.motion.oppie.flickerLow);
  // The front door's arrival and its light (src/components/door): durations in ms, distances in px, shares in %.
  vars['door-point'] = `${tokens.motion.door.point}ms`;
  vars['door-mark'] = `${tokens.motion.door.mark}ms`;
  vars['door-settle'] = `${tokens.motion.door.settle}px`;
  vars['door-lift'] = `${tokens.motion.door.lift}px`;
  vars['door-iris-scale'] = tokens.motion.door.irisScale;
  vars['door-glow'] = `${tokens.brand.door.glow}%`;
  vars['door-band'] = `${tokens.brand.door.band}%`;

  return declarations(vars);
}

/**
 * CSS for both themes. `data-theme` can be set on <html> or on any element
 * to scope a theme to a subtree; "system" follows the visitor's OS setting.
 */
export function themeCss(): string {
  return [
    `:root{${sharedDeclarations()}}`,
    `:root,[data-theme="dark"]{${themeDeclarations('dark')}}`,
    `[data-theme="light"],[data-theme="system"]{${themeDeclarations('light')}}`,
    `@media (prefers-color-scheme: dark){[data-theme="system"]{${themeDeclarations('dark')}}}`,
  ].join('\n');
}
