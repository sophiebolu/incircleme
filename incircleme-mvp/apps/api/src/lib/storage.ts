import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

// Photo-storage port. Local disk in dev (served at /uploads/*); R2 adapter lands in
// Phase 2 behind the same interface — callers never touch the filesystem directly.
export interface PhotoStorage {
  /** Persists the buffer, returns a URL path the API serves. */
  save(buffer: Buffer, ext: string): Promise<string>;
  remove(url: string): Promise<void>;
}

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const uploadsDir = join(apiRoot, 'uploads');
// Created eagerly: @fastify/static requires the root to exist at registration,
// including in tests that inject a fake storage.
mkdirSync(uploadsDir, { recursive: true });

export function createLocalStorage(): PhotoStorage {
  return {
    async save(buffer, ext) {
      const name = `${randomBytes(16).toString('hex')}.${ext.replace(/[^a-z0-9]/gi, '')}`;
      writeFileSync(join(uploadsDir, name), buffer);
      return `/uploads/${name}`;
    },
    async remove(url) {
      const name = url.split('/').pop();
      if (name) rmSync(join(uploadsDir, name), { force: true });
    },
  };
}
