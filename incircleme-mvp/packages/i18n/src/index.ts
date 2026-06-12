// Locked copy — every string here is sourced from 01-Product/Catalan_Vocabulary_Lock.md.
// DO NOT invent strings. New copy = add a row to the lock, get sign-off, then add here.
// Reading order in Barcelona: CA -> ES -> EN. CA is the default.

export type Locale = 'ca' | 'es' | 'en';
export const defaultLocale: Locale = 'ca';

export const strings = {
  ca: {
    home: 'Inici',
    chats: 'Xats',
    bookings: 'Reserves',
    profile: 'Perfil',
    tonight: 'Aquest vespre',
    book: 'Reserva',
    roomFull: 'Sala plena',
  },
  es: {
    home: 'Inicio',
    chats: 'Chats',
    bookings: 'Reservas',
    profile: 'Perfil',
    tonight: 'Esta noche',
    book: 'Reservar',
    roomFull: 'Sala llena',
  },
  en: {
    home: 'Home',
    chats: 'Chats',
    bookings: 'Bookings',
    profile: 'Profile',
    tonight: 'Tonight',
    book: 'Book',
    roomFull: 'Room full',
  },
} as const;

export type StringKey = keyof (typeof strings)['ca'];

export function t(key: StringKey, locale: Locale = defaultLocale): string {
  return strings[locale][key] ?? strings[defaultLocale][key];
}
