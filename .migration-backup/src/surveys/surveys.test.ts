import { describe, expect, it } from 'vitest';
import { formatAnswer, readAnswers } from './answers';
import { csvCell, toCsv } from './csv';
import { fillMergeTags } from './merge';
import { questionDraftSchema, questionListSchema, slugify, slugSchema, structuralChange } from './questions';
import { parseRecipients } from './recipients';
import { summarize, type ResponseForStats } from './stats';
import { answerField, type QuestionType, type SurveyAnswers, type SurveyQuestion } from './types';

const q = (id: string, type: QuestionType, extra: Partial<SurveyQuestion> = {}): SurveyQuestion => ({
  id,
  type,
  prompt: `Question ${id}`,
  helpText: '',
  required: false,
  options: type === 'single_choice' || type === 'multiple_choice' ? [{ id: 'aaaa', label: 'Alpha' }, { id: 'bbbb', label: 'Beta' }, { id: 'cccc', label: 'Gamma' }] : [],
  ...extra,
});

const form = (entries: [string, string][]) => (field: string) => entries.filter(([k]) => k === field).map(([, v]) => v);

describe('readAnswers', () => {
  const questions = [
    q('short', 'short_text'),
    q('long', 'long_text'),
    q('one', 'single_choice'),
    q('many', 'multiple_choice'),
    q('rate', 'rating'),
    q('nps', 'nps'),
    q('yn', 'yes_no'),
  ];

  it('accepts a full, valid set of answers', () => {
    const { answers, errors } = readAnswers(
      questions,
      form([
        [answerField('short'), '  Hello  '],
        [answerField('long'), 'Line one\r\nLine two'],
        [answerField('one'), 'bbbb'],
        [answerField('many'), 'aaaa'],
        [answerField('many'), 'cccc'],
        [answerField('many'), 'aaaa'],
        [answerField('rate'), '4'],
        [answerField('nps'), '0'],
        [answerField('yn'), 'no'],
      ]),
    );
    expect(errors).toEqual({});
    expect(answers).toEqual({ short: 'Hello', long: 'Line one\nLine two', one: 'bbbb', many: ['aaaa', 'cccc'], rate: 4, nps: 0, yn: false });
  });

  it('leaves out unanswered optional questions', () => {
    const { answers, errors } = readAnswers(questions, form([]));
    expect(answers).toEqual({});
    expect(errors).toEqual({});
  });

  it('asks for required answers', () => {
    const required = questions.map((question) => ({ ...question, required: true }));
    const { errors } = readAnswers(required, form([]));
    expect(Object.keys(errors).sort()).toEqual(['long', 'many', 'nps', 'one', 'rate', 'short', 'yn']);
    expect(errors.many).toBe('Choose at least one option.');
    expect(errors.short).toBe('Please answer this question.');
  });

  it('refuses values outside the question', () => {
    const { answers, errors } = readAnswers(
      questions,
      form([
        [answerField('one'), 'zzzz'],
        [answerField('many'), 'aaaa'],
        [answerField('many'), 'nope'],
        [answerField('rate'), '6'],
        [answerField('nps'), '11'],
        [answerField('yn'), 'maybe'],
        [answerField('short'), 'x'.repeat(501)],
      ]),
    );
    expect(answers).toEqual({});
    expect(Object.keys(errors).sort()).toEqual(['many', 'nps', 'one', 'rate', 'short', 'yn']);
    expect(errors.short).toBe('Keep your answer under 500 characters.');
  });

  it('refuses scores that are not whole numbers', () => {
    const { errors } = readAnswers([q('rate', 'rating'), q('nps', 'nps')], form([[answerField('rate'), '3.5'], [answerField('nps'), '-1']]));
    expect(Object.keys(errors).sort()).toEqual(['nps', 'rate']);
  });

  it('echoes what was entered so the form can show it again', () => {
    const { echo } = readAnswers(questions, form([[answerField('short'), 'Draft'], [answerField('many'), 'bbbb'], [answerField('rate'), '9']]));
    expect(echo.short).toBe('Draft');
    expect(echo.many).toEqual(['bbbb']);
    expect(echo.rate).toBe('9');
  });

  it('ignores fields that are not questions', () => {
    const { answers } = readAnswers([q('short', 'short_text')], form([[answerField('other'), 'x'], ['q.short.extra', 'y']]));
    expect(answers).toEqual({});
  });
});

describe('formatAnswer', () => {
  it('turns stored values into readable text', () => {
    expect(formatAnswer(q('one', 'single_choice'), 'bbbb')).toBe('Beta');
    expect(formatAnswer(q('many', 'multiple_choice'), ['cccc', 'aaaa'])).toBe('Alpha; Gamma');
    expect(formatAnswer(q('yn', 'yes_no'), true)).toBe('Yes');
    expect(formatAnswer(q('yn', 'yes_no'), false)).toBe('No');
    expect(formatAnswer(q('nps', 'nps'), 0)).toBe('0');
    expect(formatAnswer(q('short', 'short_text'), 'Hi')).toBe('Hi');
    expect(formatAnswer(q('short', 'short_text'), undefined)).toBe('');
  });
});

describe('summarize', () => {
  const responses = (values: (SurveyAnswers[string] | undefined)[], id = 'x'): ResponseForStats[] =>
    values.map((value, i) => ({
      id: `r${i}`,
      answers: value === undefined ? {} : { [id]: value },
      submittedAt: new Date(2026, 0, i + 1),
      respondent: null,
    }));

  it('counts choices as a share of people who answered', () => {
    const summary = summarize(q('x', 'single_choice'), responses(['aaaa', 'aaaa', 'bbbb', undefined]));
    expect(summary.kind).toBe('choice');
    if (summary.kind !== 'choice') return;
    expect(summary.answered).toBe(3);
    expect(summary.skipped).toBe(1);
    expect(summary.bars.map((b) => [b.label, b.count, Math.round(b.percent)])).toEqual([
      ['Alpha', 2, 67],
      ['Beta', 1, 33],
      ['Gamma', 0, 0],
    ]);
  });

  it('lets multiple choice add up to more than 100 percent', () => {
    const summary = summarize(q('x', 'multiple_choice'), responses([['aaaa', 'bbbb'], ['aaaa']]));
    if (summary.kind !== 'choice') throw new Error('expected choice');
    expect(summary.multiple).toBe(true);
    expect(summary.bars.map((b) => b.percent)).toEqual([100, 50, 0]);
  });

  it('counts yes and no', () => {
    const summary = summarize(q('x', 'yes_no'), responses([true, true, false]));
    if (summary.kind !== 'choice') throw new Error('expected choice');
    expect(summary.bars.map((b) => [b.label, b.count])).toEqual([
      ['Yes', 2],
      ['No', 1],
    ]);
  });

  it('averages ratings and shows their spread', () => {
    const summary = summarize(q('x', 'rating'), responses([5, 4, 4, 3, undefined]));
    if (summary.kind !== 'rating') throw new Error('expected rating');
    expect(summary.average).toBe(4);
    expect(summary.bars.map((b) => b.count)).toEqual([0, 0, 1, 2, 1]);
    expect(summarize(q('x', 'rating'), []).kind === 'rating' && (summarize(q('x', 'rating'), []) as { average: number | null }).average).toBeNull();
  });

  it('scores NPS as promoters minus detractors', () => {
    // 5 promoters (9-10), 3 passives (7-8), 2 detractors (0-6): 50% - 20% = 30.
    const summary = summarize(q('x', 'nps'), responses([10, 10, 9, 9, 9, 8, 7, 7, 6, 0]));
    if (summary.kind !== 'nps') throw new Error('expected nps');
    expect(summary.score).toBe(30);
    expect([summary.promoters, summary.passives, summary.detractors]).toEqual([5, 3, 2]);
    expect(summary.bars).toHaveLength(11);
  });

  it('reaches the ends of the NPS range', () => {
    const all = (value: number) => summarize(q('x', 'nps'), responses([value, value]));
    expect((all(10) as { score: number }).score).toBe(100);
    expect((all(6) as { score: number }).score).toBe(-100);
    expect((all(7) as { score: number }).score).toBe(0);
    expect((summarize(q('x', 'nps'), []) as { score: number | null }).score).toBeNull();
  });

  it('lists text answers newest first', () => {
    const summary = summarize(q('x', 'long_text'), responses(['first', undefined, 'third']));
    if (summary.kind !== 'text') throw new Error('expected text');
    expect(summary.answers.map((a) => a.text)).toEqual(['third', 'first']);
    expect(summary.skipped).toBe(1);
  });
});

describe('CSV', () => {
  it('quotes every cell and doubles quotes', () => {
    expect(csvCell('plain')).toBe('"plain"');
    expect(csvCell('say "hi", then\nleave')).toBe('"say ""hi"", then\nleave"');
  });

  it('keeps formulas from running in spreadsheets', () => {
    for (const risky of ['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx', '\rx']) expect(csvCell(risky).startsWith(`"'`)).toBe(true);
    expect(csvCell('a=1')).toBe('"a=1"');
  });

  it('builds a file Excel reads as UTF-8', () => {
    const csv = toCsv([
      ['Name', 'Answer'],
      ['Zoë', 'Oui'],
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿"Name","Answer"\r\n"Zoë","Oui"\r\n');
  });
});

describe('parseRecipients', () => {
  it('reads the usual shapes of a contact line', () => {
    const { recipients, invalid, duplicates } = parseRecipients(
      [
        'Jane Doe <Jane@Example.com>',
        'John Roe, john@example.com',
        'Ana Lima\tana@example.com',
        'solo@example.com',
        'kim@example.com\tKim Park',
        '"O\'Brien, Pat" <pat.obrien@example.com>',
        "o'neil@example.com",
        '',
        'Name\tEmail',
        'Jane again <jane@example.com>',
      ].join('\n'),
    );
    expect(recipients).toEqual([
      { name: 'Jane Doe', email: 'jane@example.com' },
      { name: 'John Roe', email: 'john@example.com' },
      { name: 'Ana Lima', email: 'ana@example.com' },
      { name: '', email: 'solo@example.com' },
      { name: 'Kim Park', email: 'kim@example.com' },
      { name: "O'Brien, Pat", email: 'pat.obrien@example.com' },
      { name: '', email: "o'neil@example.com" },
    ]);
    expect(invalid).toEqual(['Name\tEmail']);
    expect(duplicates).toBe(1);
  });

  it('splits several people on one line', () => {
    expect(parseRecipients('Jane Doe <jane@example.com>; Roe, John <john@example.com>').recipients).toEqual([
      { name: 'Jane Doe', email: 'jane@example.com' },
      { name: 'Roe, John', email: 'john@example.com' },
    ]);
    expect(parseRecipients('a@example.com, b@example.com').recipients.map((r) => r.email)).toEqual(['a@example.com', 'b@example.com']);
  });

  it('flags lines without a usable address', () => {
    expect(parseRecipients('not an email\njane@example').invalid).toEqual(['not an email', 'jane@example']);
  });
});

describe('questions', () => {
  const draft = (extra: Record<string, unknown>) => ({ id: 'new-abcd1234', type: 'short_text', prompt: 'Why?', helpText: '', required: false, options: [], ...extra });

  it('needs two differently labeled options for choice questions', () => {
    expect(questionDraftSchema.safeParse(draft({ type: 'single_choice', options: [{ id: 'aaaa', label: 'One' }] })).success).toBe(false);
    expect(
      questionDraftSchema.safeParse(draft({ type: 'single_choice', options: [{ id: 'aaaa', label: 'One' }, { id: 'bbbb', label: 'one' }] })).success,
    ).toBe(false);
    expect(
      questionDraftSchema.safeParse(draft({ type: 'multiple_choice', options: [{ id: 'aaaa', label: 'One' }, { id: 'bbbb', label: 'Two' }] })).success,
    ).toBe(true);
  });

  it('drops options from questions that do not use them', () => {
    const parsed = questionDraftSchema.parse(draft({ type: 'rating', options: [{ id: 'aaaa', label: 'One' }] }));
    expect(parsed.options).toEqual([]);
  });

  it('requires the question text', () => {
    expect(questionListSchema.safeParse([draft({ prompt: '   ' })]).success).toBe(false);
  });

  it('allows only wording changes once there are responses', () => {
    const before = [q('a', 'single_choice'), q('b', 'short_text')];
    const same = before.map((question) => ({ ...question }));
    expect(structuralChange(before, same)).toBeNull();
    const reworded = [{ ...before[0]!, prompt: 'New wording', helpText: 'Help', options: before[0]!.options.map((o) => ({ ...o, label: `${o.label}!` })) }, before[1]!];
    expect(structuralChange(before, reworded)).toBeNull();
    expect(structuralChange(before, [before[1]!, before[0]!])).toMatch(/reordered/);
    expect(structuralChange(before, [before[0]!])).toMatch(/added or removed/);
    expect(structuralChange(before, [{ ...before[0]!, type: 'multiple_choice' }, before[1]!])).toMatch(/type/);
    expect(structuralChange(before, [{ ...before[0]!, required: true }, before[1]!])).toMatch(/required/);
    expect(structuralChange(before, [{ ...before[0]!, options: before[0]!.options.slice(1) }, before[1]!])).toMatch(/Options/);
  });

  it('makes tidy addresses from titles', () => {
    expect(slugify('  Customer Pulse: Q3 & Beyond!  ')).toBe('customer-pulse-q3-and-beyond');
    expect(slugify('Café Owners Survey')).toBe('cafe-owners-survey');
    expect(slugify('x'.repeat(80))).toHaveLength(60);
    expect(slugSchema.safeParse('Good-Slug-2').success).toBe(true);
    expect(slugSchema.safeParse('bad--slug').success).toBe(false);
    expect(slugSchema.safeParse('no').success).toBe(false);
  });
});

describe('fillMergeTags', () => {
  it('fills name and survey, with a friendly fallback', () => {
    expect(fillMergeTags('Hi {name}, about {survey}', { name: 'Jane', survey: 'Pulse' })).toBe('Hi Jane, about Pulse');
    expect(fillMergeTags('Hi {name},', { name: '  ', survey: 'Pulse' })).toBe('Hi there,');
    expect(fillMergeTags('Keep {other}', { name: 'Jane', survey: 'Pulse' })).toBe('Keep {other}');
  });
});
