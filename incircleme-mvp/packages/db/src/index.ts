export * as schema from './schema';
export {
  users,
  magicLinkTokens,
  sessions,
  oauthAccounts,
} from './schema';
export type {
  UserRow,
  NewUserRow,
  MagicLinkTokenRow,
  SessionRow,
  OAuthAccountRow,
} from './schema';
export { db, pool } from './client';
export type { DB } from './client';
