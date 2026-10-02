import 'server-only';

/**
 * Set while an admin sees the site as a visitor does (the switch beside the
 * Admin pill, src/app/(site)/visitor-view-actions.ts). A session cookie, so it
 * ends when the browser closes; read only for signed-in admins (getAccess).
 */
export const VISITOR_VIEW_COOKIE = 'opero_visitor_view';
