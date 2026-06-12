import type {
  ArrivingMoment,
  ArrivingState,
  AuthResult,
  AuthTokens,
  BookingListItem,
  BookResult,
  CircleDetail,
  CircleMessage,
  CircleSummary,
  EventDetail,
  EventListItem,
  MeResponse,
  MessageAttachment,
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

  // --- Circles ---
  myCircles: () => request<CircleSummary[]>('/me/circles'),
  getCircle: (id: string) => request<CircleDetail>(`/circles/${id}`),
  circleMessages: (id: string, opts: { before?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.before) params.set('before', opts.before);
    if (opts.limit) params.set('limit', String(opts.limit));
    const q = params.toString();
    return request<CircleMessage[]>(`/circles/${id}/messages${q ? `?${q}` : ''}`);
  },
  postCircleMessage: (id: string, body: string, attachments?: MessageAttachment[]) =>
    request<CircleMessage>(`/circles/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, attachments }),
    }),
  keepVote: (id: string, vote: boolean) =>
    request<{ keepYesCount: number; kept: boolean }>(`/circles/${id}/keep`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    }),
  listArriving: (eventId: string) => request<ArrivingMoment[]>(`/events/${eventId}/arriving`),
  uploadArriving: async (eventId: string, state: ArrivingState, uri: string) => {
    const token = await getAccessToken();
    const form = new FormData();
    form.append('state', state);
    // RN FormData file part; on web the uri is a blob/data url.
    form.append('photo', {
      uri,
      name: 'moment.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const res = await fetch(`${BASE}/events/${eventId}/arriving`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new ApiError(res.status, `http_${res.status}`);
    return (await res.json()) as ArrivingMoment;
  },
};
