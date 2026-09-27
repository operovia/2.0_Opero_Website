import { answerField, NPS_SCALE, RATING_SCALE, TEXT_LIMITS, type AnswerValue, type SurveyAnswers, type SurveyQuestion } from './types';

export type AnswerErrors = Record<string, string>;

/** What the person entered, as plain strings, so a failed submit can show it again. */
export type AnswerEcho = Record<string, string | string[]>;

export type ReadAnswers = { answers: SurveyAnswers; errors: AnswerErrors; echo: AnswerEcho };

const REQUIRED = 'Please answer this question.';

/**
 * Reads and checks a respondent's answers against the survey's questions.
 * `values` returns every submitted value for a form field. Unknown fields
 * are ignored; nothing outside the questions' own options is accepted.
 */
export function readAnswers(questions: SurveyQuestion[], values: (field: string) => string[]): ReadAnswers {
  const answers: SurveyAnswers = {};
  const errors: AnswerErrors = {};
  const echo: AnswerEcho = {};

  for (const question of questions) {
    const raw = values(answerField(question.id)).map((v) => v.trim());
    const set = (value: AnswerValue) => {
      answers[question.id] = value;
    };

    switch (question.type) {
      case 'short_text':
      case 'long_text': {
        const text = (raw[0] ?? '').replace(/\r\n/g, '\n');
        echo[question.id] = text;
        const limit = TEXT_LIMITS[question.type];
        if (text.length > limit) errors[question.id] = `Keep your answer under ${limit.toLocaleString('en-US')} characters.`;
        else if (text) set(text);
        else if (question.required) errors[question.id] = REQUIRED;
        break;
      }
      case 'single_choice': {
        const choice = raw[0] ?? '';
        echo[question.id] = choice;
        if (choice && question.options.some((o) => o.id === choice)) set(choice);
        else if (choice) errors[question.id] = 'Choose one of the options.';
        else if (question.required) errors[question.id] = REQUIRED;
        break;
      }
      case 'multiple_choice': {
        const chosen = [...new Set(raw.filter(Boolean))];
        echo[question.id] = chosen;
        const valid = question.options.filter((o) => chosen.includes(o.id)).map((o) => o.id);
        if (valid.length !== chosen.length) errors[question.id] = 'Choose from the options shown.';
        else if (valid.length) set(valid);
        else if (question.required) errors[question.id] = 'Choose at least one option.';
        break;
      }
      case 'rating':
      case 'nps': {
        const value = raw[0] ?? '';
        echo[question.id] = value;
        const scale: readonly number[] = question.type === 'rating' ? RATING_SCALE : NPS_SCALE;
        const score = /^\d{1,2}$/.test(value) ? Number(value) : NaN;
        if (scale.includes(score)) set(score);
        else if (value) errors[question.id] = 'Choose a number on the scale.';
        else if (question.required) errors[question.id] = REQUIRED;
        break;
      }
      case 'yes_no': {
        const value = raw[0] ?? '';
        echo[question.id] = value;
        if (value === 'yes' || value === 'no') set(value === 'yes');
        else if (value) errors[question.id] = 'Choose yes or no.';
        else if (question.required) errors[question.id] = REQUIRED;
        break;
      }
    }
  }

  return { answers, errors, echo };
}

/** An answer as readable text, for the results, a single response, and the CSV export. */
export function formatAnswer(question: SurveyQuestion, value: AnswerValue | undefined): string {
  if (value === undefined || value === null) return '';
  switch (question.type) {
    case 'single_choice':
      return question.options.find((o) => o.id === value)?.label ?? '';
    case 'multiple_choice': {
      const ids = Array.isArray(value) ? value : [];
      return question.options
        .filter((o) => ids.includes(o.id))
        .map((o) => o.label)
        .join('; ');
    }
    case 'yes_no':
      return value === true ? 'Yes' : value === false ? 'No' : '';
    case 'rating':
    case 'nps':
      return typeof value === 'number' ? String(value) : '';
    default:
      return typeof value === 'string' ? value : '';
  }
}
