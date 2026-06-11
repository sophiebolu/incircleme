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
    // Auth — magic-link email (locked 2026-06-11, vocab lock §15)
    magicLinkSubject: 'El teu enllaç — entra a la sala',
    magicLinkBody:
      "Toca aquest enllaç per entrar. S'obre una vegada i dura 15 minuts. Si no l'has demanat, ignora'l — no passa res fins que el toquis.",
  },
  es: {
    home: 'Inicio',
    chats: 'Chats',
    bookings: 'Reservas',
    profile: 'Perfil',
    tonight: 'Esta noche',
    book: 'Reservar',
    roomFull: 'Sala llena',
    magicLinkSubject: 'Tu enlace — entra a la sala',
    magicLinkBody:
      'Toca este enlace para entrar. Se abre una vez y dura 15 minutos. Si no lo has pedido, ignóralo — no pasa nada hasta que lo toques.',
  },
  en: {
    home: 'Home',
    chats: 'Chats',
    bookings: 'Bookings',
    profile: 'Profile',
    tonight: 'Tonight',
    book: 'Book',
    roomFull: 'Room full',
    magicLinkSubject: 'Your link — open the room',
    magicLinkBody:
      "Tap this link to walk in. It opens once, lasts 15 minutes. If you didn't ask for this, ignore it — nothing happens until you tap.",
  },
} as const;

export type StringKey = keyof (typeof strings)['ca'];

export function t(key: StringKey, locale: Locale = defaultLocale): string {
  return strings[locale][key] ?? strings[defaultLocale][key];
}
