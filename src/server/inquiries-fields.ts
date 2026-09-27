/** Names of the spam-trap fields, shared by the public forms and the server. */

/** The hidden field real people never fill in. */
export const HONEYPOT_FIELD = 'website';
/**
 * How long the page had been open when the form was sent, in milliseconds,
 * measured by the browser (no clock differences). Near-instant submissions
 * are treated as automated.
 */
export const ELAPSED_FIELD = 'elapsed';
