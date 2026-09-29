import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { onOneLine, withLineBreaks, withoutEmphasis } from './headline';

const html = (text: string, emphasis = false) => renderToStaticMarkup(createElement(Fragment, null, withLineBreaks(text, { emphasis })));

describe('headlines', () => {
  it('starts a new line where Enter was pressed', () => {
    expect(html('I lived with the problem for 25 years.\nThen I built the solution.')).toBe(
      'I lived with the problem for 25 years.<br/>Then I built the solution.',
    );
    expect(html('One line')).toBe('One line');
  });

  it('sets words between asterisks in italics where the headline offers it', () => {
    expect(html('*The* AI-driven platform', true)).toBe('<em>The</em> AI-driven platform');
    expect(html('One *two* three *four*', true)).toBe('One <em>two</em> three <em>four</em>');
    expect(html('*The* AI-driven\nplatform for *you*', true)).toBe('<em>The</em> AI-driven<br/>platform for <em>you</em>');
    expect(html('*The* platform')).toBe('*The* platform');
  });

  it('leaves text without a matched pair alone', () => {
    expect(html('A lone * asterisk', true)).toBe('A lone * asterisk');
    expect(html('*Across\nlines*', true)).toBe('*Across<br/>lines*');
  });

  it('shows plain text on one line', () => {
    expect(onOneLine('I lived with the problem.\nThen I built the solution.')).toBe('I lived with the problem. Then I built the solution.');
    expect(withoutEmphasis('*The* AI-driven operating platform for property management.')).toBe('The AI-driven operating platform for property management.');
  });
});
