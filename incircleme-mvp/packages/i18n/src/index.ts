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
    // Auth — magic-link email (vocab lock §15)
    magicLinkSubject: 'El teu enllaç — entra a la sala',
    magicLinkBody:
      "Toca aquest enllaç per entrar. S'obre una vegada i dura 15 minuts. Si no l'has demanat, ignora'l — no passa res fins que el toquis.",
    // Booking confirmation email (vocab lock §16)
    bookingSubject: 'La sala és teva — {event_title}, {date}',
    bookingBody:
      "La teva plaça està reservada. {host} acull a {neighbourhood} {day} {date} a les {time}. L'adreça s'obre aquí el dia abans. Demà t'afegim al Cercle — és on tothom es troba abans.",
    // Home ad-slot eyebrows (vocab lock §17)
    adTonightsPick: 'Aquesta nit',
    adBookedByNeighbours: 'Reservat pels veïns',
    adSixWeekRitual: 'Ritual de 6 setmanes',
    // Home sections + booking surfaces (vocab lock §13b, §4, §5)
    typesOfEvents: "Tipus d'esdeveniments",
    seatsLeft: 'Places lliures',
    bookThisRoom: 'Reserva aquesta sala',
    signIn: 'Entra',
    continueLabel: 'Continua',
    catFoodDrink: 'Menjar i beure',
    catWellness: 'Benestar',
    catArtCraft: 'Art',
    catMusic: 'Música',
    catNature: 'Natura',
    catLearning: 'Aprenentatge',
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
    bookingSubject: 'La sala es tuya — {event_title}, {date}',
    bookingBody:
      'Tu plaza está reservada. {host} recibe en {neighbourhood} el {day} {date} a las {time}. La dirección se abre aquí el día antes. Mañana te añadimos al Círculo — es donde todos se encuentran antes.',
    adTonightsPick: 'Esta noche',
    adBookedByNeighbours: 'Reservado por vecinos',
    adSixWeekRitual: 'Ritual de 6 semanas',
    typesOfEvents: 'Tipos de eventos',
    seatsLeft: 'Plazas libres',
    bookThisRoom: 'Reservar esta sala',
    signIn: 'Entrar',
    continueLabel: 'Continuar',
    catFoodDrink: 'Comida y bebida',
    catWellness: 'Bienestar',
    catArtCraft: 'Arte',
    catMusic: 'Música',
    catNature: 'Naturaleza',
    catLearning: 'Aprendizaje',
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
    bookingSubject: 'The room is yours — {event_title}, {date}',
    bookingBody:
      "Your seat is held. {host} is hosting in {neighbourhood} on {day} {date} at {time}. The address opens here the day before. We'll add you to the Circle tomorrow — that's where everyone gathers before.",
    adTonightsPick: "Tonight's pick",
    adBookedByNeighbours: 'Booked by neighbours',
    adSixWeekRitual: '6-week ritual',
    typesOfEvents: 'Types of events',
    seatsLeft: 'Seats left',
    bookThisRoom: 'Book this room',
    signIn: 'Sign in',
    continueLabel: 'Continue',
    catFoodDrink: 'Food & Drink',
    catWellness: 'Wellness',
    catArtCraft: 'Art & Craft',
    catMusic: 'Music',
    catNature: 'Nature',
    catLearning: 'Learning',
  },
} as const;

export type StringKey = keyof (typeof strings)['ca'];

export function t(key: StringKey, locale: Locale = defaultLocale): string {
  return strings[locale][key] ?? strings[defaultLocale][key];
}

/** Fills {placeholders} in a locked template. Unknown keys are left intact. */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? vars[key]! : `{${key}}`,
  );
}
