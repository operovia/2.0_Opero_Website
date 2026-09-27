import { tokens, type ThemeColors, type ThemeName } from './tokens';

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

function themeDeclarations(name: ThemeName): string {
  const colors: ThemeColors = tokens.color[name];
  const vars: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(colors)) vars[kebab(key)] = value;
  for (const [key, value] of Object.entries(tokens.shadow[name])) vars[`shadow-${key}`] = value;
  vars['aurora-opacity'] = tokens.palette.auroraOpacity[name];
  return `color-scheme: ${name};${declarations(vars)}`;
}

function sharedDeclarations(): string {
  const vars: Record<string, string | number> = {};

  tokens.palette.aurora.forEach((color, i) => (vars[`aurora-${i + 1}`] = color));
  for (const [key, value] of Object.entries(tokens.modules)) vars[`module-${key}`] = value;

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

  for (const [key, value] of Object.entries(tokens.motion.duration)) vars[`duration-${key}`] = `${value}ms`;
  for (const [key, value] of Object.entries(tokens.motion.ease)) vars[`ease-${kebab(key)}`] = cubic(value);
  vars['reveal-distance'] = `${tokens.motion.revealDistance}px`;

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
