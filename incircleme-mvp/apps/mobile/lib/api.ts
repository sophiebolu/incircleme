import type {
  ArrivingMoment,
  ArrivingState,
  AuthResult,
  AuthTokens,
  BookingListItem,
  BookResult,
  Capsule,
  CircleDetail,
  CircleMessage,
  CircleSummary,
  CreateProgramRequest,
  CredentialKind,
  EventDetail,
  EventListItem,
  MeResponse,
  MeStats,
  MessageAttachment,
  Program,
  PublicProgramCard,
  PublicProgramDetail,
  SubmitProgramResult,
  UpdateProgramRequest,
} from '@incircleme/types';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from './auth';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

async function rawRequest<T>(path: string, init: RequestInit): Promise<T> {
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

// Single-flight refresh: concurrent 401s share one rotation (refresh tokens are
// single-use — parallel refreshes would revoke each other).
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clearSession();
        return false;
      }
      await saveSession((await res.json()) as AuthTokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Authed request with one transparent refresh-and-retry on 401. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !path.startsWith('/auth/')) {
      if (await tryRefresh()) return rawRequest<T>(path, init);
    }
    throw err;
  }
}

export const api = {
  listEvents: (
    query: { category?: string; neighbourhood?: string; dateFrom?: string; dateTo?: string } = {},
  ) => {
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
  meStats: () => request<MeStats>('/me/stats'),
  requestMagicLink: (email: string) =>
    request<{ ok: boolean }>('/auth/email-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyMagicLink: (token: string) =>
    request<AuthResult>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  oauthGoogle: (idToken: string) =>
    request<AuthResult>('/auth/oauth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
  // DEV-ONLY: the API route exists only when NODE_ENV !== 'production'.
  devLogin: (email?: string) =>
    request<AuthResult>('/dev/login', { method: 'POST', body: JSON.stringify({ email }) }),
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
  getCapsule: (circleId: string) => request<Capsule>(`/circles/${circleId}/capsule`),
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

  // --- Programs (creator/Premium) ---
  listMyPrograms: () => request<Program[]>('/me/programs'),
  getMyProgram: (id: string) => request<Program>(`/me/programs/${id}`),
  createProgram: (body: CreateProgramRequest) =>
    request<Program>('/me/programs', { method: 'POST', body: JSON.stringify(body) }),
  updateProgram: (id: string, body: UpdateProgramRequest) =>
    request<Program>(`/me/programs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  // --- Public Programs (verified, no auth) ---
  listPublicPrograms: () => request<PublicProgramCard[]>('/programs'),
  getPublicProgram: (id: string) => request<PublicProgramDetail>(`/programs/${id}`),

  submitProgram: (id: string) =>
    // Body must be a non-empty JSON value: the client always sends content-type
    // application/json, and Fastify rejects an empty body for that content-type.
    request<SubmitProgramResult>(`/me/programs/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  uploadCredential: async (id: string, kind: CredentialKind, uri: string) => {
    const token = await getAccessToken();
    const form = new FormData();
    form.append('fileKind', kind);
    form.append('file', { uri, name: 'credential.jpg', type: 'image/jpeg' } as unknown as Blob);
    const res = await fetch(`${BASE}/me/programs/${id}/credentials`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new ApiError(res.status, `http_${res.status}`);
    return (await res.json()) as Program;
  },
};
