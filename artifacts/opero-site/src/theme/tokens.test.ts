import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { tokens, type ThemeColors, type ThemeName } from './tokens';

/** [foreground, background, minimum ratio]. Text needs 4.5:1, UI boundaries 3:1. */
const requiredPairs: [keyof ThemeColors, keyof ThemeColors, number][] = [
  ['fg', 'canvas', 4.5],
  ['fg', 'surface', 4.5],
  ['fg', 'surfaceRaised', 4.5],
  ['fgMuted', 'canvas', 4.5],
  ['fgMuted', 'canvasRaised', 4.5],
  ['fgMuted', 'surface', 4.5],
  ['fgMuted', 'surfaceRaised', 4.5],
  ['fgSubtle', 'canvas', 4.5],
  ['fgSubtle', 'canvasRaised', 4.5],
  ['fgSubtle', 'surface', 4.5],
  ['accent', 'canvas', 4.5],
  ['accent', 'surface', 4.5],
  ['onAccent', 'accent', 4.5],
  ['onAccent', 'accentHover', 4.5],
  ['success', 'surface', 4.5],
  ['warning', 'surface', 4.5],
  ['danger', 'surface', 4.5],
  ['lineInput', 'surface', 3],
  ['lineInput', 'canvas', 3],
  ['focusRing', 'canvas', 3],
  ['focusRing', 'surface', 3],
];

describe.each(['dark', 'light'] as ThemeName[])('%s theme contrast', (theme) => {
  const colors = tokens.color[theme];
  it.each(requiredPairs)('%s on %s meets %d:1', (fg, bg, min) => {
    expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });
});
