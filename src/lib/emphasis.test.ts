import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { withEmphasis, withoutEmphasis } from './emphasis';

const describeParts = (text: string) =>
  withEmphasis(text).map((part) => (isValidElement(part) ? `<${String(part.type)}>${(part as ReactElement<{ children: string }>).props.children}` : part));

describe('emphasis in one-line text', () => {
  it('sets words between asterisks in italics', () => {
    expect(describeParts('*The* AI-driven platform')).toEqual(['<em>The', ' AI-driven platform']);
    expect(describeParts('One *two* three *four*')).toEqual(['One ', '<em>two', ' three ', '<em>four']);
  });

  it('leaves text without a matched pair alone', () => {
    expect(describeParts('Plain text')).toEqual(['Plain text']);
    expect(describeParts('A lone * asterisk')).toEqual(['A lone * asterisk']);
  });

  it('drops the asterisks for plain places', () => {
    expect(withoutEmphasis('*The* AI-driven operating platform for property management.')).toBe('The AI-driven operating platform for property management.');
  });
});
