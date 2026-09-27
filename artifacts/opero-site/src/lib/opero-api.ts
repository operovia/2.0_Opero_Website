import type { FormState } from '@/lib/forms';

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/opero${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const result = await response.json();
      message = result.message || result.error || message;
    } catch { /* A non-JSON response still has a useful status. */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function inquiry(type: 'demo' | 'partner', formData: FormData): Promise<FormState> {
  const values = Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === 'string')) as Record<string, string>;
  try {
    await api('/inquiries', { method: 'POST', body: JSON.stringify({ type, ...values }) });
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Could not send your details. Please try again.', values };
  }
}

export async function requestDemo(_previous: FormState, formData: FormData): Promise<FormState> {
  return inquiry('demo', formData);
}

export async function applyForSeat(_previous: FormState, formData: FormData): Promise<FormState> {
  return inquiry('partner', formData);
}