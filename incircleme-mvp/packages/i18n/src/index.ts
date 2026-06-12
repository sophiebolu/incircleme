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
    circleKept: 'Cercle mantingut', // short badge surfaces only (§20 note)
    memoryCapsule: 'Càpsula de records',
    arrivingBefore: 'Com hi vens?',
    arrivingAfter: 'Com en surts?',
    skipForNow: 'Salta de moment',
    theDifference: 'La diferència',
    // Circle chat surfaces (vocab lock §20, locked 2026-06-12)
    composerPlaceholder: 'Escriu al Cercle…',
    membersLine: '{circle} · {count} membres · {barri}',
    addressUnlocksPrefix: "L'adreça s'obre ",
    addressUnlocksEm: 'el dia abans',
    addressUnlockedNote: "L'adreça s'obre demà al matí. La veuràs aquí.",
    roomOpensIn: "La sala s'obre en {hours}h",
    afterlifeEyebrow: 'El després',
    keepGoingEm: 'viu',
    votesProgress: '{yes} de {total} han votat · en calen 4',
    voteYes: 'Sí, mantén-lo',
    voteNo: 'Deixa que es tanqui',
    votedWaiting: 'Has votat — esperant el grup.',
    keptByGroup: 'Mantingut pel grup · des del {date}',
    keptNote: 'Sense compte enrere, sense adreça — només el grup.',
    arrivingHelper: 'Una foto — cel, cafè, mà, la teva cara. Qualsevol cosa. O salta-ho.',
    arrivingFade:
      "S'esvaeix del xat en 48h, guardada per sempre a la teva Càpsula de records.",
    addYours: 'Afegeix la teva',
    verifyFailed: 'Aquest codi no ha funcionat — demana’n un de nou',
    requestFailed: "No s'ha pogut enviar l'enllaç — torna-ho a provar.",
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
    catAll: 'Eventos',
    catFoodDrink: 'Comida y bebida',
    catWellness: 'Bienestar',
    catArtCraft: 'Arte',
    catMusic: 'Música',
    catNature: 'Naturaleza',
    catLearning: 'Aprendizaje',
    circle: 'Círculo',
    keepThisCircle: 'Mantén este Círculo',
    circleKept: 'Círculo mantenido',
    memoryCapsule: 'Cápsula de recuerdos',
    arrivingBefore: '¿Cómo vienes?',
    arrivingAfter: '¿Cómo te vas?',
    skipForNow: 'Omitir por ahora',
    theDifference: 'La diferencia',
    composerPlaceholder: 'Escribe al Círculo…',
    membersLine: '{circle} · {count} miembros · {barri}',
    addressUnlocksPrefix: 'La dirección se abre ',
    addressUnlocksEm: 'el día antes',
    addressUnlockedNote: 'La dirección se abre mañana por la mañana. La verás aquí.',
    roomOpensIn: 'La sala se abre en {hours}h',
    afterlifeEyebrow: 'El después',
    keepGoingEm: 'vivo',
    votesProgress: '{yes} de {total} han votado · faltan 4',
    voteYes: 'Sí, mantenlo',
    voteNo: 'Deja que se cierre',
    votedWaiting: 'Has votado — esperando al grupo.',
    keptByGroup: 'Mantenido por el grupo · desde el {date}',
    keptNote: 'Sin cuenta atrás, sin dirección — solo el grupo.',
    arrivingHelper: 'Una foto — cielo, café, mano, tu cara. Cualquier cosa. O sáltalo.',
    arrivingFade:
      'Se desvanece del chat en 48h, guardada para siempre en tu Cápsula de recuerdos.',
    addYours: 'Añade la tuya',
    verifyFailed: 'Ese código no ha funcionado — pide uno nuevo',
    requestFailed: 'No se ha podido enviar el enlace — inténtalo de nuevo.',
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
    catAll: 'Events',
    catFoodDrink: 'Food & Drink',
    catWellness: 'Wellness',
    catArtCraft: 'Art & Craft',
    catMusic: 'Music',
    catNature: 'Nature',
    catLearning: 'Learning',
    circle: 'Circle',
    keepThisCircle: 'Keep this Circle',
    circleKept: 'Circle kept',
    memoryCapsule: 'Memory Capsule',
    arrivingBefore: 'How are you arriving tonight?',
    arrivingAfter: 'How are you leaving?',
    skipForNow: 'Skip for now',
    theDifference: 'The difference',
    composerPlaceholder: 'Message the Circle…',
    membersLine: '{circle} · {count} members · {barri}',
    addressUnlocksPrefix: 'Address unlocks ',
    addressUnlocksEm: 'the day before',
    addressUnlockedNote: "Address unlocks tomorrow morning. You'll see it here.",
    roomOpensIn: 'The room opens in {hours}h',
    afterlifeEyebrow: 'The afterlife',
    keepGoingEm: 'going',
    votesProgress: '{yes} of {total} have voted · 4 needed',
    voteYes: 'Yes, keep it',
    voteNo: 'Let it close',
    votedWaiting: 'You voted — waiting on the group.',
    keptByGroup: 'Kept by the group · since {date}',
    keptNote: 'No countdown, no address — just the group.',
    arrivingHelper: 'A photo — sky, coffee, hand, your face. Anything. Or skip.',
    arrivingFade: 'Auto-fades in chat after 48h, kept forever in your Memory Capsule.',
    addYours: 'Add yours',
    verifyFailed: "That code didn't work — request a new one",
    requestFailed: "Couldn't send the link — try again.",
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

/**
 * Locale-aware price formatting (Addendum/§20 review note): ca/es "15,00 €",
 * en "€15.00". Always via Intl — never hand-rolled decimals.
 */
const PRICE_LOCALE: Record<Locale, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };

export function formatPrice(
  cents: number,
  currency = 'EUR',
  locale: Locale = defaultLocale,
): string {
  return new Intl.NumberFormat(PRICE_LOCALE[locale], { style: 'currency', currency }).format(
    cents / 100,
  );
}
