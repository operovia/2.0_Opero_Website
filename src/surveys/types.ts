export const questionTypes = [
  'short_text',
  'long_text',
  'single_choice',
  'multiple_choice',
  'rating',
  'nps',
  'yes_no',
] as const;

export type QuestionType = (typeof questionTypes)[number];

export type SurveyOption = { id: string; label: string };

/** A stored answer: text, one or more option ids, a score, or yes/no. */
export type AnswerValue = string | string[] | number | boolean;

export type SurveyAnswers = Record<string, AnswerValue>;

export const surveyStatuses = ['draft', 'open', 'closed'] as const;
export type SurveyStatus = (typeof surveyStatuses)[number];
