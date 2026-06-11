import type { FastifyInstance } from 'fastify';
import { pool } from '@incircleme/db';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    let db: 'up' | 'down' = 'down';
    try {
      const { rows } = await pool.query('select 1 as ok');
      db = rows[0]?.ok === 1 ? 'up' : 'down';
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, ts: new Date().toISOString() };
  });
}
