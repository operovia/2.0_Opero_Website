import type { z } from 'zod';

/** The result a form action hands back to its form. */
export type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values, so a failed submit keeps what the person typed. */
  values?: Record<string, string>;
};

export const idleState: FormState = { status: 'idle' };

/** First error message for each field in a failed zod parse. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Plain string values of a form submission, for echoing back after an error. */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

export function failure(message: string, extra: Omit<FormState, 'status' | 'message'> = {}): FormState {
  return { status: 'error', message, ...extra };
}

export function success(message?: string, extra: Omit<FormState, 'status' | 'message'> = {}): FormState {
  return { status: 'success', message, ...extra };
}
