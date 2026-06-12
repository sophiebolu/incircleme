import type {
  AuthResult,
  AuthTokens,
  BookingListItem,
  BookResult,
  EventDetail,
  EventListItem,
  MeResponse,
} from '@incircleme/types';
import { getAccessToken } from './auth';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      code = ((await res.json()) as { error?: string }).error ?? code;
    } catch {
      // keep the status-based code
    }
    throw new ApiError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listEvents: (query: { category?: string; neighbourhood?: string } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v != null) as [string, string][],
    ).toString();
    return request<EventListItem[]>(`/events${params ? `?${params}` : ''}`);
  },
  getEvent: (id: string) => request<EventDetail>(`/events/${id}`),
  book: (eventId: string, seatCount = 1) =>
    request<BookResult>(`/events/${eventId}/book`, {
      method: 'POST',
      body: JSON.stringify({ seatCount }),
    }),
  myBookings: () => request<BookingListItem[]>('/me/bookings'),
  me: () => request<MeResponse>('/me'),
  requestMagicLink: (email: string) =>
    request<{ ok: boolean }>('/auth/email-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyMagicLink: (token: string) =>
    request<AuthResult>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  refresh: (refreshToken: string) =>
    request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
