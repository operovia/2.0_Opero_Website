import { z } from 'zod';

const EMAIL_MAX = 254;
const emailShape = z.email();

/**
 * The address a link to the door carries in ?email=, to fill in the field:
 * only one value, of an address's length and shape. Anything else fills in
 * nothing, so the parameter can put no other text on the page.
 */
export function doorPrefill(value: string | string[] | undefined): string {
  if (typeof value !== 'string') return '';
  const address = value.trim();
  return address.length <= EMAIL_MAX && emailShape.safeParse(address).success ? address : '';
}
