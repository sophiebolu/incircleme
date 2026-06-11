export * as schema from './schema';
export {
  users,
  magicLinkTokens,
  sessions,
  oauthAccounts,
  events,
  bookings,
} from './schema';
export type {
  UserRow,
  NewUserRow,
  MagicLinkTokenRow,
  SessionRow,
  OAuthAccountRow,
  EventRow,
  NewEventRow,
  BookingRow,
  NewBookingRow,
} from './schema';
export { db, pool } from './client';
export type { DB } from './client';
