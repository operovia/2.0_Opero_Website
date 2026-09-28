/**
 * Small values that browser code needs. They live apart from the registry,
 * which carries every section's fields, seed copy, and validation, so the
 * public pages do not ship all of that to visitors.
 */

/** Any link to this target opens the demo request form (see DemoDialog). */
export const DEMO_TARGET = '#book-demo';

/** Where the Investor Hub lives. Visitors see it only while it is switched on in Settings. */
export const INVESTOR_HUB_PATH = '/investors';
