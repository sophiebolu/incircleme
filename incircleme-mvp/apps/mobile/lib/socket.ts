import { io, type Socket } from 'socket.io-client';
import type { SocketMessageNew } from '@incircleme/types';
import { getAccessToken } from './auth';
import { api } from './api';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Authed singleton socket. JWT goes in the handshake; the server checks
 * membership per room. On an auth-rejected handshake (expired access token),
 * `api.me()` triggers the transparent refresh, then we reconnect once.
 */
export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (socket) return socket; // connecting / re-authing — same instance keeps its listeners

  const s = io(BASE, {
    auth: { token: await getAccessToken() },
    transports: ['websocket', 'polling'],
  });
  s.on('connect_error', async (err) => {
    if (err.message !== 'unauthorized') return;
    try {
      await api.me(); // a 401 here triggers the transparent refresh in request()
      (s.auth as { token?: string | null }).token = await getAccessToken();
      s.connect(); // same instance — room re-joins + handlers survive
    } catch {
      // session truly gone; UI routes to sign-in on the next API call
    }
  });
  socket = s;
  return s;
}

export async function joinCircle(
  circleId: string,
  onMessage: (payload: SocketMessageNew) => void,
): Promise<() => void> {
  const s = await getSocket();
  const join = () => s.emit('circle:join', circleId);
  join();
  s.on('connect', join); // re-join after any reconnect
  const handler = (payload: SocketMessageNew) => {
    if (payload.circleId === circleId) onMessage(payload);
  };
  s.on('message:new', handler);
  return () => {
    s.off('message:new', handler);
    s.off('connect', join);
    s.emit('circle:leave', circleId);
  };
}
