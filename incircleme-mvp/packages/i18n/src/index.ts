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
    // Home hero (vocab lock §18) — {name}/{count} interpolate; Em parts render italic coral-ink
    homeGreetingPrefix: 'Hola, ',
    homeSubEm: '{count} sales petites',
    homeSubRest: ' obrint-se al teu barri aquesta setmana.',
    // Search placeholder (vocab lock §19 — Pass 40: no "people")
    searchPlaceholder: 'Cerca esdeveniments, programes, llocs…',
    // Home sections + booking surfaces (vocab lock §13b, §4, §5)
    typesOfEvents: "Tipus d'esdeveniments",
    seatsLeft: 'Places lliures',
    bookThisRoom: 'Reserva aquesta sala',
    signIn: 'Entra',
    continueLabel: 'Continua',
    catAll: 'Esdeveniments',
    catFoodDrink: 'Menjar i beure',
    catWellness: 'Benestar',
    catArtCraft: 'Art',
    catMusic: 'Música',
    catNature: 'Natura',
    catLearning: 'Aprenentatge',
    // Circle chat — locked §6 + §10b
    circle: 'Cercle',
    keepThisCircle: 'Manté aquest Cercle',
    circleKept: 'Cercle mantingut',
    memoryCapsule: 'Càpsula de records',
    arrivingBefore: 'Com hi vens?',
    arrivingAfter: 'Com en surts?',
    skipForNow: 'Salta de moment',
    theDifference: 'La diferència',
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
    homeGreetingPrefix: 'Hola, ',
    homeSubEm: '{count} salas pequeñas',
    homeSubRest: ' abriendo en tu barrio esta semana.',
    searchPlaceholder: 'Busca eventos, programas, lugares…',
    typesOfEvents: 'Tipos de eventos',
    seatsLeft: 'Plazas libres',
    bookThisRoom: 'Reservar esta sala',
    signIn: 'Entrar',
    continueLabel: 'Continuar',
    circle: 'Círculo',
    keepThisCircle: 'Mantén este Círculo',
    circleKept: 'Círculo mantenido',
    memoryCapsule: 'Cápsula de recuerdos',
    arrivingBefore: '¿Cómo vienes?',
    arrivingAfter: '¿Cómo te vas?',
    skipForNow: 'Omitir por ahora',
    theDifference: 'La diferencia',
    catAll: 'Eventos',
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
    homeGreetingPrefix: 'Hello, ',
    homeSubEm: '{count} small rooms',
    homeSubRest: ' opening in your barrio this week.',
    searchPlaceholder: 'Browse events, programs, places…',
    typesOfEvents: 'Types of events',
    seatsLeft: 'Seats left',
    bookThisRoom: 'Book this room',
    signIn: 'Sign in',
    continueLabel: 'Continue',
    circle: 'Circle',
    keepThisCircle: 'Keep this Circle',
    circleKept: 'Circle kept',
    memoryCapsule: 'Memory Capsule',
    arrivingBefore: 'How are you arriving tonight?',
    arrivingAfter: 'How are you leaving?',
    skipForNow: 'Skip for now',
    theDifference: 'The difference',
    catAll: 'Events',
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

// ============================================================================
// PENDING §20 — Circle-chat strings lifted VERBATIM from the v3 prototype chat
// screen. NOT yet in the Vocabulary Lock: EN-only, awaiting Alina's sign-off
// (proposed as §20). Once locked, these move into `strings` with CA/ES rows.
// Do not edit wording here — edit the lock, then mirror.
// ============================================================================
export const pendingS20 = {
  composerPlaceholder: 'Message the Circle…',
  membersLine: '{circle} · {count} members · {barri}',
  addressUnlocksPrefix: 'Address unlocks ',
  addressUnlocksEm: 'the day before',
  addressUnlockedNote: "Address unlocks tomorrow morning. You'll see it here.",
  roomOpensIn: 'The room opens in {hours}h',
  afterlifeEyebrow: 'The afterlife',
  keepGoingEm: 'going', // renders after locked "Keep this Circle"
  votesProgress: '{yes} of {total} have voted · 4 needed',
  voteYes: 'Yes, keep it',
  voteNo: 'Let it close',
  votedWaiting: 'You voted — waiting on the group.',
  keptSince: 'since {date}', // renders after locked "Circle kept"
  keptNote: 'No countdown, no address — just the group.',
  arrivingHelper: 'A photo — sky, coffee, hand, your face. Anything. Or skip.',
  arrivingFade: 'Auto-fades in chat after 48h, kept forever in your Memory Capsule.',
  addYours: 'Add yours',
  // Sign-in feedback (EN dictated by Alina 2026-06-12; CA/ES pending §20)
  verifyFailed: "That code didn't work — request a new one",
  requestFailed: "Couldn't send the link — try again.",
} as const;
