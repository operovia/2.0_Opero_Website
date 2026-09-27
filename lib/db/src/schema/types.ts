export type RichMark = { type: 'bold' } | { type: 'italic' } | { type: 'link'; attrs: { href: string } };
export type RichInline = { type: 'text'; text: string; marks?: RichMark[] } | { type: 'hardBreak' };
export type RichParagraph = { type: 'paragraph'; content?: RichInline[] };
export type RichDoc = { type: 'doc'; content: RichParagraph[] };

export const questionTypes = [
  'short_text',
  'long_text',
  'single_choice',
  'multiple_choice',
  'rating',
  'nps',
  'yes_no',
] as const;
export const surveyStatuses = ['draft', 'open', 'closed'] as const;
export type SurveyOption = { id: string; label: string };
export type AnswerValue = string | string[] | number | boolean;
export type SurveyAnswers = Record<string, AnswerValue>;