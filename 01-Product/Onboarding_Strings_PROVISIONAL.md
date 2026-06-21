# Onboarding strings — PROVISIONAL (for sign-off)

Branch `feat/onboarding`. Every string below is wired in `incircleme-mvp/packages/i18n`
under the `onb_*` keys, marked **PROVISIONAL**. Reading order CA → ES → EN; **CA ships by
default**. Once signed off, these promote into the Catalan Vocabulary Lock under the next
free §-numbers and the PROVISIONAL markers come off.

Notes for review:
- Welcome greeting stays **"Benvingut"** in all three locales (a deliberate Catalan-first
  brand moment); only the tag localises.
- Barrio names are proper nouns kept in **Catalan** across all locales (per the i18n rule).
- The prototype's `signup` screen was picks-last; Alina's decision is **sign-in FIRST**, so
  the sign-in copy is new (not lifted from the prototype) and is flagged below.

## Step indicator / common
| key | CA | ES | EN |
|---|---|---|---|
| `onb_stepOf` | Pas {n} de {total} | Paso {n} de {total} | Step {n} of {total} |
| `onb_back` | Enrere | Atrás | Back |

## Welcome
| key | CA | ES | EN |
|---|---|---|---|
| `onb_welcome_kicker` | Vida real · A propòsit | Vida real · A propósito | Real life · On purpose |
| `onb_welcome_greeting` | Benvingut | Benvingut | Benvingut |
| `onb_welcome_greetingTag` | — primer en català | — primero en catalán | — first in Catalan |
| `onb_welcome_titleA` | Barcelona, | Barcelona, | Barcelona, |
| `onb_welcome_titleB` | en sales petites. | en salas pequeñas. | in small rooms. |
| `onb_welcome_sub` | Trobades íntimes amb gent del barri — a tres carrers, mai a trenta. | Encuentros íntimos con gente del barrio — a tres calles, nunca a treinta. | Intimate gatherings hosted by your neighbours — three streets away, never thirty. |
| `onb_welcome_begin` | Comença | Empezar | Begin |
| `onb_welcome_signin` | Ja hi has estat? Entra. | ¿Ya has estado? Entra. | Been here before? Sign in. |

## Sign in (NEW — sign-in-first; not from prototype)
| key | CA | ES | EN |
|---|---|---|---|
| `onb_signin_title` | Entrem-hi. | Vamos a entrar. | Let’s get you in. |
| `onb_signin_sub` | Entra un cop — després et preparem el feed en uns tocs. | Entra una vez — luego preparamos tu feed en unos toques. | Sign in once — we’ll shape your feed in the next few taps. |
| `onb_signin_apple` | Continua amb Apple | Continuar con Apple | Continue with Apple |
| `onb_signin_linkedin` | Continua amb LinkedIn | Continuar con LinkedIn | Continue with LinkedIn |
| `onb_signin_or` | o | o | or |
| `onb_signin_emailLabel` | Correu | Correo | Email |
| `onb_signin_emailPlaceholder` | tu@exemple.com | tu@ejemplo.com | you@example.com |
| `onb_signin_emailCta` | Envia’m un enllaç | Enviarme un enlace | Send me a link |
| `onb_signin_emailSent` | Mira el correu — t’hi hem enviat un enllaç per entrar. | Mira tu correo — te hemos enviado un enlace para entrar. | Check your email — we’ve sent you a link to sign in. |
| `onb_signin_soon` | Aviat | Pronto | Soon |
| `onb_signin_legal` | En continuar acceptes les Condicions i la Política de privadesa. | Al continuar aceptas las Condiciones y la Política de privacidad. | By continuing you agree to our Terms and Privacy Policy. |
| *(Google button reuses locked §33 `signInWithGoogle`)* | Entra amb Google | Entrar con Google | Sign in with Google |

## Intent (6 tiles · NO identity chips)
| key | CA | ES | EN |
|---|---|---|---|
| `onb_intent_title` | Què t’hi porta? | ¿Qué te trae por aquí? | What brings you here? |
| `onb_intent_sub` | Tria’n tantes com et vinguin de gust — començarem per aquí. | Elige tantas como te apetezcan — empezaremos por ahí. | Pick as many as feel right — we’ll start there. |
| `onb_intent_continue` | Continua | Continuar | Continue |
| `onb_intent_footer` | Els estats d’ànim canvien. Ho pots reordenar quan vulguis. | Los estados de ánimo cambian. Puedes reordenarlas cuando quieras. | Moods shift. You can rearrange these any time. |
| `onb_intent_slow_down` / `_sub` | Anar a poc a poc / Cossos tranquils, matins lents | Ir despacio / Cuerpos tranquilos, mañanas lentas | Slow down / Quiet bodies, slow mornings |
| `onb_intent_meet_people` / `_sub` | Conèixer gent / Quatre cares, no quaranta | Conocer gente / Cuatro caras, no cuarenta | Meet new people / Four faces, not forty |
| `onb_intent_learn` / `_sub` | Aprendre alguna cosa / Posa-hi les mans | Aprender algo nuevo / Pon las manos | Learn something new / Pick up a new hand |
| `onb_intent_get_outside` / `_sub` | Sortir a fora / Sal, suor, posta de sol | Salir fuera / Sal, sudor, atardecer | Get outside / Salt, sweat, sunset |
| `onb_intent_make_things` / `_sub` | Fer coses / Les teves mans al fang | Hacer cosas / Tus manos en el barro | Make things / Your hands in the clay |
| `onb_intent_try_bold` / `_sub` | Provar alguna cosa atrevida / Tres passes més enllà de la teva zona | Probar algo atrevido / Tres pasos más allá de tu zona | Try something bold / Three steps past your comfort |

## Interests (canonical 6 + "I'm here to…")
| key | CA | ES | EN |
|---|---|---|---|
| `onb_interests_title` | Què faria que aquesta setmana se sentís viva? | ¿Qué haría que esta semana se sintiera viva? | What would make this week feel alive? |
| `onb_interests_sub` | Tria’n almenys 3 que t’estirin. | Elige al menos 3 que te tiren. | Pick at least 3 that pull you. |
| `onb_interests_continue` | Continua | Continuar | Continue |
| `onb_interests_footer` | Sense pressa — ho pots repensar més tard. | Sin presión — puedes repensarlas más tarde. | No pressure — you can rethink these later. |
| `onb_interest_food_drink` | Menjar i beure | Comer y beber | Food & Drink |
| `onb_interest_wellness` | Benestar | Bienestar | Wellness |
| `onb_interest_art_craft` | Art i ofici | Arte y oficio | Art & Craft |
| `onb_interest_music` | Música | Música | Music |
| `onb_interest_nature` | Natura | Naturaleza | Nature |
| `onb_interest_learning` | Aprenentatge | Aprendizaje | Learning |
| `onb_goals_label` | Hi soc per… | Estoy aquí para… | I’m here to… |
| `onb_goal_show_up` | Aparèixer | Aparecer | Show up |
| `onb_goal_meet_faces` | Conèixer cares noves | Conocer caras nuevas | Meet new faces |
| `onb_goal_host` | Organitzar la meva sala | Organizar mi propia sala | Host my own room |

## Barrio (10 + not-listed + waitlist)
| key | CA | ES | EN |
|---|---|---|---|
| `onb_barrio_title` | Quin barri sents com a casa? | ¿Qué barrio sientes como tu casa? | Which barrio do you call home? |
| `onb_barrio_sub` | Et mantindrem el feed a peu. | Mantendremos tu feed a pie. | We’ll keep your feed walkable. |
| `onb_barrio_continue` | Continua | Continuar | Continue |
| `onb_barrio_notListed` | El meu barri no hi és | Mi barrio no está en la lista | My barrio isn’t on the list |
| `onb_barrio_waitlist` | Encara no ets a Barcelona? T’escriurem quan arribem a la teva ciutat. Barcelona és on arrelem primer. | ¿Aún no estás en Barcelona? Te escribiremos cuando lleguemos a tu ciudad. Barcelona es donde echamos raíces primero. | Not in Barcelona yet? We’ll write when we arrive in your city. Barcelona is where we grow roots first. |
| `onb_barrio_*` (names) | Eixample · Gràcia · El Born · Gòtic · Sant Antoni · Poblenou · Barceloneta · El Raval · Sants · Sarrià | *(same — Catalan)* | *(same — Catalan)* |

## Notifications consent
| key | CA | ES | EN |
|---|---|---|---|
| `onb_notif_title` | Només quan passa alguna cosa de debò. | Solo cuando pasa algo de verdad. | Only when something real happens. |
| `onb_notif_sub` (promise) | Res de màrqueting. Res d’empentes. Res de «t’enyorem». | Nada de marketing. Nada de empujones. Nada de «te echamos de menos». | No marketing. No growth nudges. No “we miss you” pings. |
| `onb_notif_bookings` / `_sub` | Les teves reserves / La nit abans, el matí mateix i qualsevol canvi. Aquestes les vols. | Tus reservas / La noche antes, la mañana misma y cualquier cambio. Estas las quieres. | Your bookings / The night before, the morning of, and anything that changes. You want these. |
| `onb_notif_bookings_always` | Sempre actiu | Siempre activo | Always on |
| `onb_notif_circles` / `_sub` | Els teus Cercles / Quan algú del teu grup publica — una foto, un gràcies, un pla per a la propera. | Tus Círculos / Cuando alguien de tu grupo publica — una foto, un gracias, un plan para la próxima. | Your Circles / When someone in your small group chat posts — a photo, a thank-you, a plan for next time. |
| `onb_notif_nearby` / `_sub` | Nou al teu barri / Un grapat per setmana — només de qui segueixes o vibracions que has triat. Mai una allau. | Nuevo en tu barrio / Un puñado por semana — solo de quien sigues o vibras que has elegido. Nunca una avalancha. | New in your neighbourhood / A handful per week — only from creators you follow or vibes you picked. Never a flood. |
| `onb_notif_settings` | Ho pots canviar quan vulguis a Configuració. | Puedes cambiarlo cuando quieras en Ajustes. | You can change this any time in Settings. |
| `onb_notif_cta` | Em sembla bé | Me parece bien | That sounds good |
| `onb_notif_minimal` | Ho deixo al mínim — només reserves | Lo dejo al mínimo — solo reservas | I’ll keep it minimal — bookings only |
