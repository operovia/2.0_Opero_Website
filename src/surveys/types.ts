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

export const questionTypeLabels: Record<QuestionType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  rating: 'Rating, 1 to 5',
  nps: 'NPS, 0 to 10',
  yes_no: 'Yes or no',
};

/** Question types that need a list of options. */
export const hasOptions = (type: QuestionType): boolean => type === 'single_choice' || type === 'multiple_choice';

export type SurveyOption = { id: string; label: string };

/** A question as the builder, the respondent form, and the results see it. */
export type SurveyQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  helpText: string;
  required: boolean;
  options: SurveyOption[];
};

/** A stored answer: text, one or more option ids, a score, or yes/no. */
export type AnswerValue = string | string[] | number | boolean;

export type SurveyAnswers = Record<string, AnswerValue>;

export const surveyStatuses = ['draft', 'open', 'closed'] as const;
export type SurveyStatus = (typeof surveyStatuses)[number];

export const surveyStatusLabels: Record<SurveyStatus, string> = { draft: 'Draft', open: 'Open', closed: 'Closed' };

export const TEXT_LIMITS = { short_text: 500, long_text: 5000 } as const;
export const RATING_SCALE = [1, 2, 3, 4, 5] as const;
export const NPS_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Form field name for a question's answer. */
export const answerField = (questionId: string) => `q.${questionId}`;
