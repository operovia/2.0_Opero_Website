/**
 * Small values that browser code needs. They live apart from the registry,
 * which carries every section's fields, seed copy, and validation, so the
 * public pages do not ship all of that to visitors.
 */

/** Any link to this target opens the demo request form (see DemoDialog). */
export const DEMO_TARGET = '#book-demo';

/** Where the Investor Hub lives. Only guests who came through the front door and signed-in admins see it. */
export const INVESTOR_HUB_PATH = '/investors';

/** The public Founder page: the founder's introduction and story from the Investor Hub, for everyone. */
export const FOUNDER_PATH = '/founder';

/** The front door for invited guests. Linked from nowhere on the site and never indexed; the owner shares the link. */
export const DOOR_PATH = '/welcome';

/** A hidden field on the door's form. The script sets it to '1' before submitting; without JavaScript it stays empty, so the action knows no reveal can play and redirects instead. */
export const DOOR_ENHANCED_FIELD = 'enhanced';

/** What the door answers when it does not open, in FormState.message; the door maps each code to its copy. */
export type DoorAnswer = 'wrong' | 'empty' | 'invalid' | 'limited' | 'trouble';

export const DOOR_ANSWERS: readonly DoorAnswer[] = ['wrong', 'empty', 'invalid', 'limited', 'trouble'];

/**
 * What a guest on the list may see: a visitor the site, an investor the site
 * and the Investor Hub. A private site lets only guests (and admins) in at all.
 */
export const GUEST_ROLES = ['visitor', 'investor'] as const;
export type GuestRole = (typeof GUEST_ROLES)[number];
export const GUEST_ROLE_LABELS: Record<GuestRole, { label: string; sees: string }> = {
  visitor: { label: 'Visitor', sees: 'the site' },
  investor: { label: 'Investor', sees: 'the site and the Investor Hub' },
};

/** The modules by their bare names, in brand order, for browser code (the registry's options are server-only). */
export const MODULE_LABELS = { build: 'Build', studios: 'Studios', playbook: 'Playbook', university: 'University', compass: 'Compass' } as const;
export type ModuleName = keyof typeof MODULE_LABELS;
