import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { plainHeadline, renderHeadline } from './headline';

const html = (text: string) => renderToStaticMarkup(createElement(Fragment, null, renderHeadline(text)));
const em = (word: string) => `<em>${word}</em>`;

describe('headlines', () => {
  it('starts a new line where Enter was pressed', () => {
    expect(html('I lived with the problem for 25 years.\nThen I built the solution.')).toBe(
      'I lived with the problem for 25 years.<br/>Then I built the solution.',
    );
    expect(html('One line')).toBe('One line');
  });

  it('sets words between asterisks in italics', () => {
    expect(html('*The* AI-driven platform')).toBe(`${em('The')} AI-driven platform`);
    expect(html('One *two* three *four*')).toBe(`One ${em('two')} three ${em('four')}`);
    expect(html('Then I built *the* solution.')).toBe(`Then I built ${em('the')} solution.`);
    expect(html('*The* AI-driven\nplatform for *you*')).toBe(`${em('The')} AI-driven<br/>platform for ${em('you')}`);
  });

  it('leaves text without a matched pair alone', () => {
    expect(html('A lone * asterisk')).toBe('A lone * asterisk');
    expect(html('*Across\nlines*')).toBe('*Across<br/>lines*');
  });

  it('shows plain text on one line, without the asterisks', () => {
    expect(plainHeadline('I lived with the problem.\nThen I built *the* solution.')).toBe('I lived with the problem. Then I built the solution.');
    expect(plainHeadline('*The* AI-driven operating platform for property management.')).toBe('The AI-driven operating platform for property management.');
  });
});
