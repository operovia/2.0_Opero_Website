import { api } from './opero-api';
import type { SurveyFormState } from '@/app/s/[slug]/survey-form';

export async function submitSurvey(_previous: SurveyFormState, data: FormData): Promise<SurveyFormState> {
  const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const token = data.get('t');
  const preview = data.get('preview') === '1';
  const answers: Record<string, string | string[]> = {};
  for (const [key] of data.entries()) {
    if (!key.startsWith('q.')) continue;
    const all = data.getAll(key).map(String);
    answers[key.slice(2)] = all.length > 1 ? all : all[0] || '';
  }
  try {
    if (preview) return { status: 'submitted' };
    const result = await api<{ status?: string; errors?: Record<string, string> }>(`/surveys/${encodeURIComponent(slug)}/respond`, {
      method: 'POST',
      body: JSON.stringify({ token, answers }),
    });
    return { status: result.status === 'duplicate' ? 'duplicate' : 'submitted' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Your response could not be sent.', echo: answers };
  }
}

export function markSurveyOpened(token: string): Promise<void> {
  const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';
  return api(`/surveys/${encodeURIComponent(slug)}/open`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}