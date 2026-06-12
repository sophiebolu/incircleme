import { io, type Socket } from 'socket.io-client';
import type { SocketMessageNew } from '@incircleme/types';
import { getAccessToken } from './auth';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/** Authed singleton socket. JWT goes in the handshake; server checks membership per room. */
export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  const token = await getAccessToken();
  socket?.disconnect();
  socket = io(BASE, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export async function joinCircle(
  circleId: string,
  onMessage: (payload: SocketMessageNew) => void,
): Promise<() => void> {
  const s = await getSocket();
  s.emit('circle:join', circleId);
  const handler = (payload: SocketMessageNew) => {
    if (payload.circleId === circleId) onMessage(payload);
  };
  s.on('message:new', handler);
  return () => {
    s.off('message:new', handler);
    s.emit('circle:leave', circleId);
  };
}
