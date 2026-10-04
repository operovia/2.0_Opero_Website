/**
 * Runs in the browser before React starts (Next.js's instrumentation-client
 * file). Development only: the published site never carries it.
 *
 * React's development build draws each Server Component on the browser's
 * performance timeline with performance.measure(). It clamps where an entry
 * starts at zero but not where it ends, and on a page left open a while,
 * often after an edit refreshes it, the end can come out below zero. The
 * browser then throws, and the dev overlay reports an error naming a
 * component such as NotFound ("cannot have a negative time stamp") that is
 * not the site's. Clamping the end too, as React does the start, keeps the
 * entry and drops the false alarm. Remove this once React clamps it itself
 * (react/react#37561, vercel/next.js#86060).
 */
if (process.env.NODE_ENV === 'development') {
  const measure = performance.measure.bind(performance);
  const clamp = (time: DOMHighResTimeStamp | string | undefined) => (typeof time === 'number' && time < 0 ? 0 : time);
  performance.measure = (name: string, startOrOptions?: string | PerformanceMeasureOptions, endMark?: string): PerformanceMeasure =>
    typeof startOrOptions === 'object' && startOrOptions !== null
      ? measure(name, { ...startOrOptions, start: clamp(startOrOptions.start), end: clamp(startOrOptions.end) }, endMark)
      : measure(name, startOrOptions, endMark);
}
