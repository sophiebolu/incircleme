import type { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { db, circleMembers } from '@incircleme/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { CircleMessage } from '@incircleme/types';
import { verifyAccessToken } from './jwt';

export interface Realtime {
  /** Broadcast a new message into the circle's room. */
  emitMessage(circleId: string, message: CircleMessage): void;
}

/** No-op used in tests (no socket server). */
export const nullRealtime: Realtime = { emitMessage() {} };

// Socket.io rides Fastify's HTTP server. Handshake: `auth.token` = access JWT.
// Clients join circle rooms with `circle:join` after a membership check.
export function createRealtime(app: FastifyInstance): Realtime {
  const io = new SocketIOServer(app.server, {
    cors: { origin: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      const claims = await verifyAccessToken(token);
      socket.data.userId = claims.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('circle:join', async (circleId: string) => {
      const [member] = await db
        .select()
        .from(circleMembers)
        .where(
          and(
            eq(circleMembers.circleId, circleId),
            eq(circleMembers.userId, socket.data.userId as string),
            isNull(circleMembers.leftAt),
          ),
        )
        .limit(1);
      if (member) await socket.join(`circle:${circleId}`);
    });
    socket.on('circle:leave', (circleId: string) => {
      void socket.leave(`circle:${circleId}`);
    });
  });

  app.addHook('onClose', async () => {
    await io.close();
  });

  return {
    emitMessage(circleId, message) {
      io.to(`circle:${circleId}`).emit('message:new', { circleId, message });
    },
  };
}
