export const ADMIN_THEME_COOKIE = 'opero_admin_theme';

export const adminThemes = ['system', 'light', 'dark'] as const;
export type AdminTheme = (typeof adminThemes)[number];

export function parseAdminTheme(value: string | undefined): AdminTheme {
  return adminThemes.includes(value as AdminTheme) ? (value as AdminTheme) : 'system';
}
