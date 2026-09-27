import { formatAnswer } from './answers';
import { NPS_SCALE, RATING_SCALE, type SurveyAnswers, type SurveyQuestion } from './types';

export type ResponseForStats = { id: string; answers: SurveyAnswers; submittedAt: Date; respondent: string | null };

export type Bar = { key: string; label: string; count: number; percent: number };

export type QuestionSummary =
  | { kind: 'choice'; answered: number; skipped: number; bars: Bar[]; multiple: boolean }
  | { kind: 'rating'; answered: number; skipped: number; average: number | null; bars: Bar[] }
  | {
      kind: 'nps';
      answered: number;
      skipped: number;
      score: number | null;
      promoters: number;
      passives: number;
      detractors: number;
      bars: Bar[];
    }
  | { kind: 'text'; answered: number; skipped: number; answers: { responseId: string; text: string; submittedAt: Date; respondent: string | null }[] };

const percent = (count: number, of: number) => (of ? (count / of) * 100 : 0);

/**
 * Summarizes one question across responses: counts and bars for choices,
 * average and spread for ratings, the NPS score for NPS, and every answer
 * for text. Percentages are of the people who answered the question.
 */
export function summarize(question: SurveyQuestion, responses: ResponseForStats[]): QuestionSummary {
  const given = responses.filter((r) => r.answers[question.id] !== undefined);
  const answered = given.length;
  const skipped = responses.length - answered;

  switch (question.type) {
    case 'single_choice':
    case 'multiple_choice': {
      const counts = new Map(question.options.map((o) => [o.id, 0]));
      for (const r of given) {
        const value = r.answers[question.id];
        for (const id of Array.isArray(value) ? value : [value]) {
          if (typeof id === 'string' && counts.has(id)) counts.set(id, counts.get(id)! + 1);
        }
      }
      const bars = question.options.map((o) => ({ key: o.id, label: o.label, count: counts.get(o.id)!, percent: percent(counts.get(o.id)!, answered) }));
      return { kind: 'choice', answered, skipped, bars, multiple: question.type === 'multiple_choice' };
    }
    case 'yes_no': {
      const yes = given.filter((r) => r.answers[question.id] === true).length;
      const no = given.filter((r) => r.answers[question.id] === false).length;
      return {
        kind: 'choice',
        answered,
        skipped,
        multiple: false,
        bars: [
          { key: 'yes', label: 'Yes', count: yes, percent: percent(yes, answered) },
          { key: 'no', label: 'No', count: no, percent: percent(no, answered) },
        ],
      };
    }
    case 'rating':
    case 'nps': {
      const scores = given.map((r) => r.answers[question.id]).filter((v): v is number => typeof v === 'number');
      const scale: readonly number[] = question.type === 'rating' ? RATING_SCALE : NPS_SCALE;
      const bars = scale.map((value) => {
        const count = scores.filter((s) => s === value).length;
        return { key: String(value), label: String(value), count, percent: percent(count, scores.length) };
      });
      if (question.type === 'rating') {
        const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        return { kind: 'rating', answered, skipped, average, bars };
      }
      const promoters = scores.filter((s) => s >= 9).length;
      const detractors = scores.filter((s) => s <= 6).length;
      const passives = scores.length - promoters - detractors;
      const score = scores.length ? Math.round(((promoters - detractors) / scores.length) * 100) : null;
      return { kind: 'nps', answered, skipped, score, promoters, passives, detractors, bars };
    }
    default: {
      const answers = given
        .map((r) => ({ responseId: r.id, text: formatAnswer(question, r.answers[question.id]), submittedAt: r.submittedAt, respondent: r.respondent }))
        .filter((a) => a.text)
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      return { kind: 'text', answered, skipped, answers };
    }
  }
}
