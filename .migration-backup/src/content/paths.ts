import { pages } from './registry';

/** Public pages that can be previewed: only known paths, never an arbitrary redirect target. */
export function publicPath(path: string): string {
  const [pathname, hash] = path.split('#');
  const known = Object.values(pages)
    .map((p) => p.path)
    .filter((p): p is string => Boolean(p));
  return known.includes(pathname ?? '') ? `${pathname}${hash ? `#${hash}` : ''}` : '/';
}
