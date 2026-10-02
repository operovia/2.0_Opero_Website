import { GREETING_MAX } from '@/content/constants';

/*
 * A guest's welcome name ("Fifth Wall"), from the guest list: the door their
 * personal link opens greets them by it, and so does the home page. The copy
 * around it lives in the content (the door's personal title and line, the
 * hero's guest greeting), with {name} where the name goes.
 */

/** Where the welcome name goes in the copy. */
export const NAME_TOKEN = '{name}';

/** A welcome name as the guest list keeps it: one line, single spaces, no asterisks (they would turn a headline's emphasis), and not too long. */
export function normalizeGreeting(input: string): string {
  return input.replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, GREETING_MAX).trim();
}

/** The copy with the welcome name in place of {name}. */
export function fillName(copy: string, name: string): string {
  return copy.split(NAME_TOKEN).join(name);
}
