import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { highlight } from './highlight';

const html = (text: string, phrase?: string) =>
  renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      highlight(text, phrase, (words, key) => createElement('b', { key }, words)),
    ),
  );

describe('highlight', () => {
  it('wraps the phrase where it stands, keeping its own case', () => {
    expect(html('Opero replaces the patchwork with one platform built around your portfolio.', 'one platform')).toBe(
      'Opero replaces the patchwork with <b>one platform</b> built around your portfolio.',
    );
    expect(html('One platform, one login.', 'one platform')).toBe('<b>One platform</b>, one login.');
  });

  it('wraps whole words only, and every occurrence', () => {
    expect(html('Someone platformed it.', 'one platform')).toBe('Someone platformed it.');
    expect(html('one platform and one platform', 'one platform')).toBe('<b>one platform</b> and <b>one platform</b>');
  });

  it('leaves the text alone without a phrase, or when the phrase is not there', () => {
    expect(html('Plain text.', '')).toBe('Plain text.');
    expect(html('Plain text.', '   ')).toBe('Plain text.');
    expect(html('Plain text.', undefined)).toBe('Plain text.');
    expect(html('Plain text.', 'missing words')).toBe('Plain text.');
  });

  it('takes the phrase literally', () => {
    expect(html('Save $100K+ a year.', '$100K+')).toBe('Save <b>$100K+</b> a year.');
    expect(html('Save 100K a year.', '$100K+')).toBe('Save 100K a year.');
  });
});
