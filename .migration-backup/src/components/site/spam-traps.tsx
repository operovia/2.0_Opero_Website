import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/server/inquiries-fields';

/**
 * Invisible to people, tempting to bots: a field that must stay empty, and
 * how long the page was open before sending. Screen readers and keyboards
 * skip the field.
 */
export function SpamTraps() {
  return (
    <>
      <div aria-hidden className="sr-only">
        <label>
          Leave this field empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name={ELAPSED_FIELD} defaultValue="" />
    </>
  );
}

/** Call from the form's onSubmit: records how long the page has been open. */
export function stampElapsed(form: HTMLFormElement) {
  const field = form.elements.namedItem(ELAPSED_FIELD);
  if (field instanceof HTMLInputElement) field.value = String(Math.round(performance.now()));
}
