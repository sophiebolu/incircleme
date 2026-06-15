import type { ReviewDetail, ReviewQueueItem, VerifyProgramRequest } from '@incircleme/types';
import type { ReviewGate } from '@incircleme/config';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'incircleme.admin.token';

// Internal tool: in dev, sign in as a Trust reviewer via the dev-only endpoint
// (/dev/login exists only when NODE_ENV !== 'production'). Production admin would
// replace this with real reviewer magic-link auth.
async function ensureReviewer(): Promise<string> {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;
  const res = await fetch(`${BASE}/dev/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'trust@incircleme.dev', role: 'trust_reviewer' }),
  });
  if (!res.ok) throw new Error('dev reviewer login failed — is the API running?');
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  return data.accessToken;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await ensureReviewer();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...init.headers },
  });
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    throw new Error('session expired — reload');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `http_${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const adminApi = {
  queue: () => req<ReviewQueueItem[]>('/admin/programs/queue'),
  gates: () => req<ReviewGate[]>('/admin/review-gates'),
  detail: (id: string) => req<ReviewDetail>(`/admin/programs/${id}`),
  verify: (id: string, body: VerifyProgramRequest) =>
    req<ReviewDetail>(`/admin/programs/${id}/verify`, { method: 'POST', body: JSON.stringify(body) }),
  reject: (id: string, reason: string) =>
    req<ReviewDetail>(`/admin/programs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  underReview: (id: string) =>
    req<ReviewDetail>(`/admin/programs/${id}/under-review`, { method: 'POST' }),
};
