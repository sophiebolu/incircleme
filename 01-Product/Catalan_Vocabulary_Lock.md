# Catalan Vocabulary Lock — IncircleMe v25.6

**Status:** Sprint 42B Deliverable 3 · Locked 2026-04-25 · Pass 27
**Owner:** Alina (founder · creator) · reviewed against editorial voice from passes 17–27
**Use:** Single source of truth for translation of every locked phrase across the app, marketing, and investor surfaces. Translators reference this file. Engineering reads from this when building i18n keys.

---

## Reading guide

- **Column EN** — the English source of truth, frozen at v25.6.
- **Column CA** — the Catalan rendering, the *language of welcome* in Barcelona. This is the default surface inside Catalonia.
- **Column ES** — the Spanish rendering. Used when the user picks Spanish or when the device locale is `es-*` outside Catalonia.
- An italic phrase (e.g. *"barri"*) means the word stays in Catalan even when the surrounding sentence is English or Spanish — it is part of the brand voice, not a translation candidate.
- A locked phrase **must not** be auto-translated. Any new screen that introduces one of these phrases reads from this glossary, not from a machine translator.

---

## 1. Brand voice phrases (do not literally translate)

| EN | CA | ES |
|----|----|----|
| Small rooms | Petites sales | Salas pequeñas |
| Barri (singular) | *Barri* | *Barri* |
| Barris (plural) | *Barris* | *Barris* |
| Keep close | Mantén-te a prop | Mantente cerca |
| Keep the Circle | Manté el Cercle | Mantén el Círculo |
| The after | El després | El después |
| Show up | Apareix | Apárecete (literal) · "Ven" preferido |
| Showing up | Apareixent · "Apareix" | Estar presente |
| Room full | Sala plena | Sala llena |
| Founding host | Amfitrió fundador / Amfitriona fundadora | Anfitrión/a fundador/a |
| The room decides | La sala decideix | La sala decide |
| Day-before warmth | Caliu del dia abans | Calidez del día antes |
| Reliability over features | Fiabilitat per damunt de funcionalitats | Fiabilidad antes que funciones |
| Boring stuff as feature | El que sembla avorrit també és funcionalitat | Lo aburrido también es funcionalidad |
| Language as welcome | La llengua és benvinguda | La lengua es bienvenida |
| Catalan-first | Català primer | Catalán primero |
| Emotion before mechanics | L'emoció abans que la mecànica | La emoción antes que la mecánica |
| Visible trust | Confiança visible | Confianza visible |
| Human content over filler | Contingut humà, no de farciment | Contenido humano, no de relleno |
| Kept rooms | Sales mantingudes | Salas mantenidas |
| Kept Circle | Cercle mantingut | Círculo mantenido |

---

## 2. Navigation labels

| EN | CA | ES |
|----|----|----|
| Home | Inici | Inicio |
| Chats | Xats | Chats |
| Create | Crear | Crear |
| Bookings | Reserves | Reservas |
| Profile | Perfil | Perfil |
| Notifications | Notificacions | Notificaciones |
| Search | Cerca | Buscar |
| Discover | Descobreix | Descubre |
| Events | Esdeveniments | Eventos |
| People | Persones | Personas |
| Rituals | Rituals | Rituales |
| Welcome back | Benvingut/da de nou | Bienvenido/a de nuevo |

> Note: we use **Chats**, never "Messages." Locked feedback rule from prior passes.

---

## 3. Onboarding & intent

| EN | CA | ES |
|----|----|----|
| Welcome | Benvingut · Benvinguda | Bienvenido · Bienvenida |
| Welcome — first in Catalan | Benvingut · primer en català | Bienvenido · primero en catalán |
| What brings you here? | Què t'hi porta? | ¿Qué te trae aquí? |
| Pick interests | Tria els teus interessos | Elige tus intereses |
| Neighbourhood | Barri | Barrio |
| Notifications consent | Permís de notificacions | Permiso de notificaciones |
| Sign up | Registra't | Regístrate |
| Sign in | Entra | Entrar |
| Continue | Continua | Continuar |
| Skip for now | Salta de moment | Omitir por ahora |
| Right now I'm… | Ara mateix estic… | Ahora mismo estoy… |
| How do you want to feel? | Com vols sentir-te? | ¿Cómo te quieres sentir? |
| Open to meeting people | Obert/a a conèixer gent | Abierto/a a conocer gente |
| Coming alone · say hi | Vinc sol/a · diga'm hola | Vengo solo/a · saluda |

---

## 4. Discovery & feed surfaces

| EN | CA | ES |
|----|----|----|
| Events in Barcelona | Esdeveniments a Barcelona | Eventos en Barcelona |
| Art in Barcelona | Art a Barcelona | Arte en Barcelona |
| Music in Barcelona | Música a Barcelona | Música en Barcelona |
| Wellness in Barcelona | Benestar a Barcelona | Bienestar en Barcelona |
| Food & Drink in Barcelona | Menjar i beure a Barcelona | Comida y bebida en Barcelona |
| Nature in Barcelona | Natura a Barcelona | Naturaleza en Barcelona |
| Learning in Barcelona | Aprenentatge a Barcelona | Aprendizaje en Barcelona |
| Near you | A prop teu | Cerca de ti |
| This week | Aquesta setmana | Esta semana |
| Tonight | Aquest vespre | Esta noche |
| New rooms | Sales noves | Salas nuevas |
| Trusted hosts | Amfitrions de confiança | Anfitriones de confianza |
| Featured | Destacat | Destacado |
| Boosted | Promocionat | Promocionado |

---

## 5. Bookings, payments, deposit

| EN | CA | ES |
|----|----|----|
| Book | Reserva | Reservar |
| Book this room | Reserva aquesta sala | Reservar esta sala |
| Confirmed | Confirmat | Confirmado |
| Pending | Pendent | Pendiente |
| Cancelled | Cancel·lat | Cancelado |
| Refunded | Retornat | Reembolsado |
| Checkout | Pagament | Pago |
| Pay | Paga | Pagar |
| Total | Total | Total |
| Deposit (€5) | Dipòsit (5 €) | Depósito (5 €) |
| Returned at check-in | Retornat en arribar | Devuelto al llegar |
| Hold seat | Reserva el lloc | Reservar plaza |
| Seats left | Places lliures | Plazas libres |
| Sold out | Esgotat | Agotado |
| Waitlist | Llista d'espera | Lista de espera |
| Join waitlist | Apunta't a la llista | Apúntate a la lista |
| Go together | Anem junts | Vamos juntos |
| Go together (request sent) | Sol·licitud d'anar junts enviada | Solicitud de ir juntos enviada |
| Go together (accepted) | Acceptat — anem junts | Aceptado — vamos juntos |
| You're going | Hi vas | Vas |
| You're on the list | Ets a la llista | Estás en la lista |

---

## 6. Circles & memory

| EN | CA | ES |
|----|----|----|
| Circle | Cercle | Círculo |
| The Circle | El Cercle | El Círculo |
| Circle chat | Xat del Cercle | Chat del Círculo |
| Memory Capsule | Càpsula de records | Cápsula de recuerdos |
| Open the Capsule | Obre la càpsula | Abre la cápsula |
| Add to Capsule | Afegeix a la càpsula | Añadir a la cápsula |
| Did the room work? | Ha funcionat la sala? | ¿Ha funcionado la sala? |
| Keep this Circle | Manté aquest Cercle | Mantén este Círculo |
| Circle kept | Cercle mantingut | Círculo mantenido |
| Circle closed | Cercle tancat | Círculo cerrado |
| Open the next room | Obre la propera sala | Abre la próxima sala |
| Next room | Propera sala | Próxima sala |
| The room decides | La sala decideix | La sala decide |
| Ritual | Ritual | Ritual |
| Recurring | Recorrent | Recurrente |
| Same time, same room | Mateixa hora, mateixa sala | Misma hora, misma sala |

---

## 7. Reputation Passport (5 tiers)

| EN | CA | ES |
|----|----|----|
| Reputation Passport | Passaport de reputació | Pasaporte de reputación |
| Newcomer | Nouvingut/da | Recién llegado/a |
| Regular | Habitual | Habitual |
| Trusted | De confiança | De confianza |
| Pillar | Pilar | Pilar |
| Legend | Llegenda | Leyenda |
| Show-up rate | Taxa d'assistència | Tasa de asistencia |
| Reliability % | Fiabilitat % | Fiabilidad % |
| Kept rooms · count | Sales mantingudes · recompte | Salas mantenidas · recuento |
| Hosting tier | Nivell d'amfitrionatge | Nivel de anfitrión |
| Regular barris | Barris habituals | Barrios habituales |
| Your Passport travels | El teu Passaport viatja amb tu | Tu Pasaporte viaja contigo |

---

## 8. Vibes (editorial self-disclosure on profile)

| EN | CA | ES |
|----|----|----|
| Vibe | Caràcter | Estilo |
| Your vibe | El teu caràcter | Tu estilo |
| Show 2 more | Mostra'n 2 més | Mostrar 2 más |
| Hide vibes | Amaga els caràcters | Ocultar |
| Relaxed | Relaxat | Relajado |
| Curious | Encuriosit | Curioso |
| Playful | Juganer | Juguetón |
| Quiet | Tranquil | Tranquilo |
| Outdoorsy | D'aire lliure | De aire libre |
| Creative | Creatiu | Creativo |

> Note: Vibe is text only — no audio, no play button. Locked.

---

## 9. Host-side surfaces

| EN | CA | ES |
|----|----|----|
| Host | Amfitrió · Amfitriona | Anfitrión · Anfitriona |
| Become a host | Fes-te amfitrió/a | Hazte anfitrión/a |
| Create event | Crea un esdeveniment | Crear evento |
| Create ritual | Crea un ritual | Crear ritual |
| Title | Títol | Título |
| When | Quan | Cuándo |
| Where | On | Dónde |
| Who | Qui | Quién |
| Seats | Places | Plazas |
| Price | Preu | Precio |
| Description | Descripció | Descripción |
| Cover photo | Foto de portada | Foto de portada |
| Add deposit (€5) | Afegeix dipòsit (5 €) | Añadir depósito (5 €) |
| Publish | Publica | Publicar |
| Boost this event | Promociona aquest esdeveniment | Promocionar evento |
| Reschedule | Canvia la data | Reprogramar |
| Move indoors | Mou-ho a l'interior | Mover al interior |
| Refund all | Retorna a tothom | Reembolsar a todos |
| Weather contingency | Pla pel mal temps | Plan por mal tiempo |
| QR check-in | Check-in QR | Check-in QR |
| Marked attended | Marcat com a present | Marcado como asistente |
| Attendance % | Assistència % | Asistencia % |

---

## 10. Sensitive / fairness phrases (legally aware)

| EN | CA | ES |
|----|----|----|
| Wheelchair accessible | Accessible per a cadira de rodes | Accesible para silla de ruedas |
| Vegetarian-friendly | Apte per a vegetarians | Apto para vegetarianos |
| Child-friendly | Apte per a nens | Apto para niños |
| Language(s) spoken | Llengua / llengües parlades | Lengua(s) hablada(s) |
| No-show policy | Política de no-show | Política de no-show |
| Two-strike rule | Regla de dos avisos | Regla de dos avisos |
| 30-day Circle mute | Silenci de Cercle 30 dies | Silencio de Círculo 30 días |
| Insurance covered | Assegurança coberta | Seguro cubierto |
| Up to €1M per event | Fins a 1 milió € per esdeveniment | Hasta 1 millón € por evento |

---

## 10b. Arriving — pre/post event mood prompt (locked 2026-04-25)

The before/after mood photo feature uses these locked prompts:

| EN | CA | ES |
|----|----|----|
| How are you arriving tonight? | Com hi vens? | ¿Cómo vienes? |
| How are you leaving? | Com en surts? | ¿Cómo te vas? |
| Skip for now | Salta de moment | Omitir por ahora |
| The difference | La diferència | La diferencia |
| The Circle has been here together | El Cercle ha estat junt | El Círculo ha estado junto |
| Add to Capsule | Afegeix a la càpsula | Añadir a la cápsula |

Voice rule: never ask "how was it" (review-tone). Always ask **how you arrived** and **how you left** — emotion-tone, not transaction-tone.

---

## 11. Customer-journey landmark screens (locked verbatim)

These four screens use the Catalan return-screen copy as locked. Translators must not adapt these:

### Marta · returning after 14-day lapse (locked Catalan)

> **Tornes a casa, Marta.**
> El Cercle de Sopars de Sants encara és aquí. Cinc persones t'han mantingut a prop. Vols veure on es troben aquesta setmana?

(Spanish parallel, also locked:)

> **Vuelves a casa, Marta.** El Círculo de Cenas de Sants sigue aquí. Cinco personas te han mantenido cerca. ¿Quieres ver dónde se encuentran esta semana?

(English parallel, also locked:)

> **You're home, Marta.** The Sants supper Circle is still here. Five people kept you close. Want to see where they meet this week?

### Jordi · first-time host onboarding

> **Bona nit, Jordi.** Aquí no construïm audiència. Construïm sales. La primera la triem junts.

> **Buenas noches, Jordi.** Aquí no construimos audiencia. Construimos salas. La primera la elegimos juntos.

> **Good evening, Jordi.** Here we don't build audiences. We build rooms. We choose the first one together.

### Founding-host invitation

> **Ets dels primers cinquanta.** Gràcia comença amb tu. Després ve la resta.

> **Eres de los primeros cincuenta.** Gràcia empieza contigo. Después viene el resto.

> **You're one of the first fifty.** Gràcia begins with you. The rest comes after.

### Circle-afterlife threshold (4 of N)

> **La sala vol tornar.** Quatre persones del Cercle volen una propera trobada. Obres la sala?

> **La sala quiere volver.** Cuatro personas del Círculo quieren un próximo encuentro. ¿Abres la sala?

> **The room wants to come back.** Four people in the Circle want to meet again. Do you open the room?

---

## 12. Anti-vocabulary (banned, never use)

These phrases are explicitly **not** allowed in user-facing copy. Translators must reject them and reach for the canonical phrase from this glossary instead.

| Banned (EN) | Why | Use instead |
|-------------|-----|-------------|
| Follow / Following / Followers | Influencer vocabulary; not what we build | Keep close · Mantén-te a prop · Mantente cerca |
| Tag along / Tag-along / +1 / Bring a friend | Positions one person as add-on, the other as main | Go together · Anem junts · Vamos juntos |
| Friend / Friends | Implies Facebook-graph mechanics | Keep close + Circle |
| Stream / Streamer | We are not media | Host · Amfitrió · Anfitrión |
| Engagement | Mechanic-first language | Showing up · Apareixent · Presencia |
| Tickets | Transactional only — not the room | Seats · Places · Plazas |
| Sold out (in CTAs) | Use "Room full" for warmth | Room full · Sala plena · Sala llena |
| Cancel | Hard verb | Reschedule · Canvia la data · Reprogramar (when possible) |
| Subscriber | SaaS language | Host (Pro / Premium) |
| Audience | Builds wrong mental model | Circle · Cercle · Círculo |
| Notification dot | UI detail, not user-facing word | (silent — show the dot, do not name it) |

---

## 13. How translators work with this file

1. Find the canonical EN phrase. If it isn't here, **stop** and add it through Alina before shipping.
2. Render the CA and ES rows from the corresponding column. Do not paraphrase.
3. If the phrase carries a feeling we haven't pinned (e.g. a new editorial line), open a row marked `// pending Alina sign-off` and route to Alina. Never let a translator decide brand voice unilaterally.
4. The columns are read in this order in Barcelona: **CA → ES → EN**. Outside Catalonia, the device locale picks first.
5. Pluralisation, gender, and accord follow normal CA / ES grammar — but the *vocabulary* is locked. The grammar wraps it; it does not bend it.

---

## 13b. Home section eyebrows — Pass 33 (added 2026-04-27)

The 2026-04-27 Home redesign locked a new top→bottom order (Ad → Types of events → People → Where your people are walking in) and three new section eyebrows. Locked here so the EN/CA/ES strings do not drift between sessions.

| EN (locked) | CA (locked) | ES (locked) |
|-------------|-------------|-------------|
| Types of *events* | Tipus d'*esdeveniments* | Tipos de *eventos* |
| Find *people* to join events with | Troba *gent* per anar junts | Encuentra *gente* con quien ir |
| Where your people are *walking in* | On *entren* els teus | Dónde *entran* los tuyos |

Notes for translators.

- The italic word always lands on the noun or verb that carries the emotional weight: *events* / *esdeveniments* / *eventos*; *people* / *gent* / *gente*; *walking in* / *entren* / *entran*. Italic is not decorative; it is the meaning-bearer.
- "Walking in" stays imagistic in all three languages — *entrar* (CA/ES) carries the right physical-presence feeling. Do not soften to *unir-se* (CA) / *unirse* (ES) or *atendre* (CA) / *asistir* (ES); those are abstract and break the editorial promise of the room being a real place a real body walks into.
- The verb *anar junts* / *vamos juntos* is the canonical CA/ES rendering of "Go together" — locked in section 5 and reused here for parallel structure with the People-strip mission.

These three lines join the existing canonical landmark screens. Translators must not paraphrase.

---

## 14. Sprint 42B closure

This file closes **Sprint 42B Deliverable 3**.

- D1 ✅ Lapsed-user welcome-back screen (pass 25)
- D2 ✅ Customer Journey Marta + Jordi HTML (Apr 24)
- D3 ✅ Catalan_Vocabulary_Lock.md (this file, Apr 25)

Sprint 42B is closed. Sprint 42C (Catalan-first welcome surface, Memory Capsule reminder, Passport tier-up moment) opens next.

---

## 15. Auth — magic-link email (locked 2026-06-11)

The passwordless sign-in email. Locked verbatim by Alina; mirrored in `incircleme-mvp/packages/i18n`. Never paraphrase. Reading order CA → ES → EN.

### Subject

| EN | CA | ES |
|----|----|----|
| Your link — open the room | El teu enllaç — entra a la sala | Tu enlace — entra a la sala |

### Body

> **EN** — Tap this link to walk in. It opens once, lasts 15 minutes. If you didn't ask for this, ignore it — nothing happens until you tap.

> **CA** — Toca aquest enllaç per entrar. S'obre una vegada i dura 15 minuts. Si no l'has demanat, ignora'l — no passa res fins que el toquis.

> **ES** — Toca este enlace para entrar. Se abre una vez y dura 15 minutos. Si no lo has pedido, ignóralo — no pasa nada hasta que lo toques.

Voice notes: "walk in" / "entra" / "entra" keeps the room-as-real-place metaphor (consistent with §13b "walking in"). Never "log in" / "sign in" / "verify your email" — those are transaction-tone.

---

## 16. Booking confirmation email (locked 2026-06-11)

Sent when a seat is held/confirmed. `{braces}` are interpolated at send time. Mirrored in `incircleme-mvp/packages/i18n`. Never paraphrase. Reading order CA → ES → EN.

### Subject

| EN | CA | ES |
|----|----|----|
| The room is yours — {event_title}, {date} | La sala és teva — {event_title}, {date} | La sala es tuya — {event_title}, {date} |

### Body

> **EN** — Your seat is held. {host} is hosting in {neighbourhood} on {day} {date} at {time}. The address opens here the day before. We'll add you to the Circle tomorrow — that's where everyone gathers before.

> **CA** — La teva plaça està reservada. {host} acull a {neighbourhood} {day} {date} a les {time}. L'adreça s'obre aquí el dia abans. Demà t'afegim al Cercle — és on tothom es troba abans.

> **ES** — Tu plaza está reservada. {host} recibe en {neighbourhood} el {day} {date} a las {time}. La dirección se abre aquí el día antes. Mañana te añadimos al Círculo — es donde todos se encuentran antes.

Voice notes: "seat is held" / "plaça està reservada" — never "ticket purchased". The Circle line carries the "the after begins before" promise; keep it.

---

## 17. Home ad-slot eyebrows (locked 2026-06-11)

The three rotating eyebrow labels on the Home "Tonight" ad-slot. Mirrored in `incircleme-mvp/packages/i18n`.

| EN | CA | ES |
|----|----|----|
| Tonight's pick | Aquesta nit | Esta noche |
| Booked by neighbours | Reservat pels veïns | Reservado por vecinos |
| 6-week ritual | Ritual de 6 setmanes | Ritual de 6 semanas |

---

## 18. Home greeting + sub-line (locked 2026-06-11)

The personalized Home hero (prototype `.hh-greet` + `.hh-sub`). `{name}` and `{count}` interpolate at render. The italic always lands on the *name* (greeting) and on *"{count} small rooms"* (sub) — the meaning-bearers, per §13b italic rule. Mirrored in `incircleme-mvp/packages/i18n`.

### Greeting (Fraunces 26px · em = italic coral-ink on the name)

| EN | CA | ES |
|----|----|----|
| Hello, *{name}*. | Hola, *{name}*. | Hola, *{name}*. |

Canonical example: "Hello, *Marta*."

### Sub-line (Fraunces 14px · em = italic coral-ink on "{count} small rooms")

> **EN** — *{count} small rooms* opening in your barrio this week.

> **CA** — *{count} sales petites* obrint-se al teu barri aquesta setmana.

> **ES** — *{count} salas pequeñas* abriendo en tu barrio esta semana.

Canonical example: "*23 small rooms* opening in your barrio this week."

---

## 19. Search placeholder (locked 2026-06-11)

The Home search bar placeholder. Replaces the Pass 40 holdover ("people" removed — people-discovery cut). Mirrored in `incircleme-mvp/packages/i18n`.

| EN | CA | ES |
|----|----|----|
| Browse events, programs, places… | Cerca esdeveniments, programes, llocs… | Busca eventos, programas, lugares… |

---

## 20. Circle chat surfaces (locked 2026-06-12)

The chat screen strings (prototype chat screen, Slice 3). `{braces}` interpolate at render. Mirrored in `incircleme-mvp/packages/i18n`. Notes: §6 "Circle kept / Cercle mantingut" stays for **short badge surfaces only** — the kept banner uses the full §20 line. "The afterlife" reuses §1's *El després / El después*. The italic em lands on *the day before* (banner) and *going/viu/vivo* (vote title).

| EN | CA | ES |
|----|----|----|
| Message the Circle… | Escriu al Cercle… | Escribe al Círculo… |
| {circle} · {count} members · {barri} | {circle} · {count} membres · {barri} | {circle} · {count} miembros · {barri} |
| Address unlocks *the day before* | L'adreça s'obre *el dia abans* | La dirección se abre *el día antes* |
| Address unlocks tomorrow morning. You'll see it here. | L'adreça s'obre demà al matí. La veuràs aquí. | La dirección se abre mañana por la mañana. La verás aquí. |
| The room opens in {hours}h | La sala s'obre en {hours}h | La sala se abre en {hours}h |
| The afterlife | El després | El después |
| Keep this Circle *going* | Manté aquest Cercle *viu* | Mantén este Círculo *vivo* |
| {yes} of {total} have voted · 4 needed | {yes} de {total} han votat · en calen 4 | {yes} de {total} han votado · faltan 4 |
| Yes, keep it | Sí, mantén-lo | Sí, mantenlo |
| Let it close | Deixa que es tanqui | Deja que se cierre |
| You voted — waiting on the group. | Has votat — esperant el grup. | Has votado — esperando al grupo. |
| Kept by the group · since {date} | Mantingut pel grup · des del {date} | Mantenido por el grupo · desde el {date} |
| No countdown, no address — just the group. | Sense compte enrere, sense adreça — només el grup. | Sin cuenta atrás, sin dirección — solo el grupo. |
| A photo — sky, coffee, hand, your face. Anything. Or skip. | Una foto — cel, cafè, mà, la teva cara. Qualsevol cosa. O salta-ho. | Una foto — cielo, café, mano, tu cara. Cualquier cosa. O sáltalo. |
| Auto-fades in chat after 48h, kept forever in your Memory Capsule. | S'esvaeix del xat en 48h, guardada per sempre a la teva Càpsula de records. | Se desvanece del chat en 48h, guardada para siempre en tu Cápsula de recuerdos. |
| Add yours | Afegeix la teva | Añade la tuya |

Canonical CA/ES names for Memory Capsule: *Càpsula de records* / *Cápsula de recuerdos* (§6) — Slice 4 reuses them exactly.

### Sign-in feedback (same lock date)

| EN | CA | ES |
|----|----|----|
| That code didn't work — request a new one | Aquest codi no ha funcionat — demana'n un de nou | Ese código no ha funcionado — pide uno nuevo |
| Couldn't send the link — try again. | No s'ha pogut enviar l'enllaç — torna-ho a provar. | No se ha podido enviar el enlace — inténtalo de nuevo. |

---

## 21. Memory Capsule screen (locked 2026-06-13)

The Capsule surfaces (prototype capsule screen, Slice 4). Canonical names per §6: *Memory Capsule / Càpsula de records / Cápsula de recuerdos*; the two-pane title reuses §10b *The difference / La diferència / La diferencia*. "frases" chosen over "cites/citas" — in a social-events app *citas* reads as romantic dates. Mirrored in `incircleme-mvp/packages/i18n`.

| EN | CA | ES |
|----|----|----|
| Your Memory Capsule is ready | La teva Càpsula de records està a punt | Tu Cápsula de recuerdos está lista |
| Photos, highlights & quotes from {date} | Fotos, moments i frases del {date} | Fotos, momentos y frases del {date} |
| The photo roll | El rodet de fotos | El carrete de fotos |
| See all ({n}) → | Mostra-les totes ({n}) → | Ver todas ({n}) → |
| Your Circle | El teu Cercle | Tu Círculo |
| {n} people — still chatting | {n} persones — encara xerrant | {n} personas — aún charlando |
| Arriving *(pane label)* | Arribant | Llegando |
| Leaving *(pane label)* | Marxant | Saliendo |
| Highlights | Moments destacats | Momentos destacados |
| {n} photos | {n} fotos | {n} fotos |
| Shared by {x} of {y} people | Compartides per {x} de {y} persones | Compartidas por {x} de {y} personas |
| {n} Circle messages | {n} missatges del Cercle | {n} mensajes del Círculo |
| Since the event ended | Des que va acabar l'esdeveniment | Desde que terminó el evento |
| Share capsule | Comparteix la càpsula | Comparte la cápsula |
| Save | Desa | Guardar |
| Memory Capsules are auto-generated from your Circle's photos & reviews. Only your Circle can see them. | Les Càpsules de records es generen automàticament amb les fotos i ressenyes del teu Cercle. Només el teu Cercle les pot veure. | Las Cápsulas de recuerdos se generan automáticamente con las fotos y reseñas de tu Círculo. Solo tu Círculo puede verlas. |
| Privacy → | Privacitat → | Privacidad → |

**Deferred (not wired):** the prototype's *"Circle stays active · next event together: {event}"* line waits for co-booking detection. When that feature lands, the line comes back **through this lock process** — it is not to be rebuilt from memory.

Behavior note (not copy): the difference view is *silent, not stigmatised* — members who skipped Arriving simply don't appear. No empty slots, no callouts.

---

## 22. Programs — submission flow (locked 2026-06-15)

The Premium host's *Submit a Program* surfaces (Slice 5 Part 1). **Net-new copy** — the v3 prototype mocks the *Program detail* (learner-facing) screen but never the creator-side submission flow, so these strings were drafted for this lock, not lifted. Mirrored in `incircleme-mvp/packages/i18n` (keys `prog_*`). Status labels are display-only; DB enum values are unchanged (e.g. `rejected` → "Not approved"). The fee figure (€150) reflects the v2 economics config — if the config changes, this line is re-locked.

### Status labels (host-facing)
| EN | CA | ES |
|---|---|---|
| Draft | Esborrany | Borrador |
| Payment pending | Pagament pendent | Pago pendiente |
| In review | En revisió | En revisión |
| Verified | Verificat | Verificado |
| Not approved | No aprovat | No aprobado |
| Paused | En pausa | En pausa |

### Fee / credit explainer
| EN | CA | ES |
|---|---|---|
| Verified Program submission — €150, refundable if not approved. | Enviament de Programa verificat — 150 €, reemborsable si no s'aprova. | Envío de Programa verificado — 150 €, reembolsable si no se aprueba. |
| Included with Premium — 1 free Program. | Inclòs amb Premium — 1 Programa gratuït. | Incluido con Premium — 1 Programa gratis. |

### Form sections
| EN | CA | ES |
|---|---|---|
| Basics | Bàsics | Lo básico |
| Curriculum | Temari | Temario |
| Accreditation | Acreditació | Acreditación |
| References | Referències | Referencias |
| Credentials | Credencials | Credenciales |
| Review & submit | Revisa i envia | Revisa y envía |

### Field labels
| EN | CA | ES |
|---|---|---|
| Title | Títol | Título |
| Description | Descripció | Descripción |
| Weeks · sessions | Setmanes · sessions | Semanas · sesiones |
| Total hours | Hores totals | Horas totales |
| How you assess | Com avalues | Cómo evalúas |
| Accrediting body (optional) | Entitat acreditadora (opcional) | Entidad acreditadora (opcional) |
| Your ID with them | El teu identificador | Tu identificador |
| Add a reference | Afegeix una referència | Añade una referencia |
| Upload a credential | Puja una credencial | Sube una credencial |

### CTAs
| EN | CA | ES |
|---|---|---|
| Save draft | Desa l'esborrany | Guardar borrador |
| Submit for review | Envia per revisar | Enviar a revisión |
| Pay & submit (€150) | Paga i envia (150 €) | Pagar y enviar (150 €) |
| Add credential | Afegeix credencial | Añadir credencial |

### List wrapper (addendum — added 2026-06-15)

The creator Programs list + entry, drafted during the checkpoint-2 build (the prototype never mocked this wrapper either).

| EN | CA | ES |
|---|---|---|
| Your Programs | Els teus Programes | Tus Programas |
| Submit a Program | Envia un Programa | Enviar un Programa |
| You don't have a Program yet. | Encara no tens cap Programa. | Aún no tienes ningún Programa. |
| Programs are a Premium feature. | Els Programes són una funció Premium. | Los Programas son una función Premium. |

### Credential kinds (addendum — added 2026-06-15)

| EN | CA | ES |
|---|---|---|
| Diploma | Diploma | Diploma |
| License | Llicència | Licencia |
| Accreditation | Acreditació | Acreditación |
| Reference letter | Carta de referència | Carta de referencia |

### Review summary (addendum — added 2026-06-15)

The "Revisa i envia" step lists the locked field labels (Setmanes · sessions, Hores totals, Acreditació, Credencials, Referències) with their values. Empty values render:

| EN | CA | ES |
|---|---|---|
| None | Cap | Ninguna |

---

## 23. Localization sweep — booking / checkout / profile (locked 2026-06-15)

Routes the last hardcoded Catalan on Slice 1–2 screens through `t()` so the app flips fully to EN/ES. CA values are the existing in-app copy (unchanged); ES/EN are the translations. Mirrored in `incircleme-mvp/packages/i18n`. (Dates are now a locale-aware formatter, not copy; the event-detail "address unlocks" line reuses §20.)

### Booking status (bookings list badge + checkout title)
| EN | CA | ES |
|---|---|---|
| Pending | Pendent | Pendiente |
| Confirmed | Confirmat | Confirmado |
| Cancelled | Cancel·lat | Cancelado |
| Refunded | Reemborsat | Reembolsado |

### Checkout
| EN | CA | ES |
|---|---|---|
| The room is yours. | La sala és teva. | La sala es tuya. |
| Pay | Paga | Pagar |
| Total | Total | Total |
| This room is no longer available. | Aquesta sala ja no hi és. | Esta sala ya no está. |

### Profile
| EN | CA | ES |
|---|---|---|
| Sign out | Surt | Salir |

---

## 24. Public Programs — listing + detail (locked 2026-06-15)

The browse-verified-Programs surfaces (Slice 5 Part 2). Prototype-verbatim EN (v3 Program-detail screen, Pass 38B/39A/39B); CA/ES are the translations. Mirrored in `incircleme-mvp/packages/i18n` (keys `prog_pub_*`). `{n}`/`{host}` interpolate; week titles, quotes, and Q&A are per-program **data**, not locked copy. Read-only this slice — the ask/answer composer + "See sample →" are deferred with the Q&A write-path / certificates (Part 3). Tier badges render with the AA-passing gold (`#7E6410`) / forest tokens. Canonical "Kept Circle" CA/ES = *Cercle mantingut / Círculo mantenido*.

| EN | CA | ES |
|---|---|---|
| Programs. Where craft becomes your way. | Programes. On l'ofici esdevé camí. | Programas. Donde el oficio se hace camino. |
| Verified Program | Programa verificat | Programa verificado |
| Accredited Program | Programa acreditat | Programa acreditado |
| Verified by IncircleMe Trust · the certificate is real. | Verificat per IncircleMe Trust · el certificat és real. | Verificado por IncircleMe Trust · el certificado es real. |
| Verified by IncircleMe Trust | Verificat per IncircleMe Trust | Verificado por IncircleMe Trust |
| How it works → | Com funciona → | Cómo funciona → |
| How verification works → | Com funciona la verificació → | Cómo funciona la verificación → |
| {n} weeks · what happens | {n} setmanes · què passa | {n} semanas · qué pasa |
| The certificate | El certificat | El certificado |
| Verified Program · Completion certificate | Programa verificat · Certificat de finalització | Programa verificado · Certificado de finalización |
| A real credential — not a participation sticker. | Una credencial de veritat — no un adhesiu de participació. | Una credencial de verdad — no una pegatina de participación. |
| Real completion criteria, {host}'s signature, and IncircleMe's verification seal. | Criteris de finalització reals, la signatura de {host} i el segell de verificació d'IncircleMe. | Criterios de finalización reales, la firma de {host} y el sello de verificación de IncircleMe. |
| What's included | Què inclou | Qué incluye |
| Voices from past cohorts | Veus de cohorts anteriors | Voces de cohortes anteriores |
| From each kept Circle's Memory Capsule | De la Càpsula de records de cada Cercle mantingut | De la Cápsula de recuerdos de cada Círculo mantenido |
| Questions from neighbours | Preguntes dels veïns | Preguntas de los vecinos |
| Asked publicly · answered by {host} | Preguntat en públic · respost per {host} | Preguntado en público · respondido por {host} |
| {weeks} weeks · {hours} hours | {weeks} setmanes · {hours} hores | {weeks} semanas · {hours} horas |
| the host *(fallback when a host has no display name — keeps "{host}'s signature" from rendering as "—'s")* | l'amfitrió/a | su anfitrión/a |

---

## 25. Profile enrichment (Tier 2 · locked 2026-06-17)

The self-profile screen sections (Tier 2 build). The v3 prototype mocks the self-profile (post-Pass-40), but several rows are **net-new copy** drafted for this lock. Mirrored in `incircleme-mvp/packages/i18n` (keys `prof_*`). `{date}` interpolates (formatted month + year). Tier label reuses the existing `tierLabel` map (CA, §host-row). The Reputation Passport card is an **honest summary only** — tier + member-since + "View full passport · coming soon"; the full Passport (trait rings, levels, badges) is deferred to Tier 3 and not rendered. Creator-mode tile and "View full passport" route to a coming-soon affordance; Edit profile / Share are deferred. The single language chip was deferred (app-locale ≠ spoken languages — needs a proper field).

| EN | CA | ES |
|---|---|---|
| About | Sobre mi | Sobre mí |
| Member since {date} | Membre des de {date} | Miembro desde {date} |
| Creator mode · Host your first event | Mode creador · Organitza el teu primer esdeveniment | Modo creador · Organizar tu primer evento |
| €0 to start · Secure payouts · Keep 100% on Premium | 0 € per començar · Pagaments segurs · Conserva el 100% amb Premium | 0 € para empezar · Pagos seguros · Conserva el 100% con Premium |
| Attended | Assistits | Asistidos |
| Hosted | Organitzats | Organizados |
| Reputation Passport | Passaport de reputació | Pasaporte de reputación |
| View full passport | Veure el passaport complet | Ver el pasaporte completo |
| Coming soon | Aviat | Próximamente |
| Verified identity | Identitat verificada | Identidad verificada |

The Bookings stat reuses the existing nav label **Bookings / Reserves / Reservas** (§Booking surfaces) — confirmed bookings for upcoming events. "Attended" = confirmed bookings for past events; "Hosted" = events hosted. No overlap.

---

## 26. Trust-tier labels (locked 2026-06-17)

The five `trustTier` enum values, rendered as human labels wherever a person's tier shows (Profile passport summary, HostRow). Previously a CA-only map; now locale-aware via `@incircleme/i18n` (keys `tier_*`), read through the shared `tierLabel` helper. CA matches the prior map verbatim. The enum is exactly these five — no extra/legacy values.

| enum | EN | CA | ES |
|---|---|---|---|
| newcomer | Newcomer | Nouvingut/da | Recién llegado/a |
| regular | Regular | Habitual | Habitual |
| trusted | Trusted | De confiança | De confianza |
| pillar | Pillar | Pilar | Pilar |
| legend | Legend | Llegenda | Leyenda |

---

## 27. Event detail enrichment (Tier 2 · locked 2026-06-17)

The enriched event-detail surfaces. Mirrored in `incircleme-mvp/packages/i18n` (keys `ev_*`). `{braces}` interpolate; `{amount}` is locale-formatted currency (€5 / 5 €). Two anti-vocabulary substitutions vs the v3 prototype: **"Tickets" → "Seats / Places / Plazas"** (§12) and **"Bring a friend" → "Go together / Anem junts / Vamos juntos"** (§5). The about-eyebrow is time-neutral ("room", not "evening"); its last word renders italic per §13b. The seat-hold is creator-optional (event `depositRequired`, default off) and the amount comes from `ECONOMICS.seatHold`. Review-derived host stats (★ rating, "felt included %") and the Founding-host chip are **deferred to Tier 3** — not locked here.

| EN | CA | ES |
|---|---|---|
| About this *room* | Sobre aquesta *sala* | Sobre esta *sala* |
| Already coming | Ja venen | Ya vienen |
| {filled} of {total} spots filled | {filled} de {total} places ocupades | {filled} de {total} plazas ocupadas |
| +{n} more | +{n} més | +{n} más |
| Chat opens in the event Circle after you book. No DMs to strangers before. | El xat s’obre al Cercle després de reservar. Sense missatges a desconeguts abans. | El chat se abre en el Círculo después de reservar. Sin mensajes a desconocidos antes. |
| When | Quan | Cuándo |
| Full refund up to 24h before. | Reemborsament complet fins a 24 h abans. | Reembolso completo hasta 24 h antes. |
| Where | On | Dónde |
| Open in Maps | Obre al mapa | Abrir en el mapa |
| Why book through us | Per què reservar amb nosaltres | Por qué reservar con nosotros |
| Insured | Assegurat | Asegurado |
| Covered up to €500,000 | Cobertura fins a 500.000 € | Cobertura hasta 500.000 € |
| Easy refund | Reemborsament fàcil | Reembolso fácil |
| 1-tap up to 24h before | Amb un toc fins a 24 h abans | Con un toque hasta 24 h antes |
| Secure payment | Pagament segur | Pago seguro |
| PCI-compliant · Stripe | Conforme a PCI · Stripe | Conforme a PCI · Stripe |
| Event Circle | Cercle de l'esdeveniment | Círculo del evento |
| Group chat included | Xat de grup inclòs | Chat de grupo incluido |
| Seats | Places | Plazas |
| General admission | Entrada general | Entrada general |
| Seat hold {amount} | Reserva de plaça {amount} | Reserva de plaza {amount} |
| Refundable — returned at check-in. Set by the host. | Reemborsable — es torna en fer el check-in. Ho decideix l'amfitrió/a. | Reembolsable — se devuelve al hacer el check-in. Lo decide el anfitrión/a. |
| Go together | Anem junts | Vamos juntos |
| {n} events hosted | {n} esdeveniments organitzats | {n} eventos organizados |

---

## 28. Bookings enrichment (Tier 2 · locked 2026-06-17)

The enriched Bookings tab — Upcoming/Past/Cancelled segmentation, richer cards, editorial empty state, active-Circle deep-link chip. Mirrored in `incircleme-mvp/packages/i18n` (keys `bk_*`). `{n}` interpolates. Tabs are client-side classification (Upcoming = held/confirmed & not yet ended · Past = confirmed & ended · Cancelled = cancelled/refunded). Status-chip labels reuse §23 (Confirmed/Pending/Cancelled/Refunded). The empty-state title is italic on the lead clause (§13b). "Circle" reuses the canonical §6/§20 *Cercle / Círculo*. Cancel/refund, waitlist, quick-actions, review chips, and the friendly booking code are deferred to later slices.

| EN | CA | ES |
|---|---|---|
| Upcoming | Properes | Próximas |
| Past | Passades | Pasadas |
| Cancelled | Cancel·lades | Canceladas |
| Circle · {n} | Cercle · {n} | Círculo · {n} |
| *Nothing on your calendar* — yet. | *Res a la teva agenda* — encara. | *Nada en tu agenda* — todavía. |
| Your next small room is three taps away. | La teva propera sala petita és a tres tocs. | Tu próxima sala pequeña está a tres toques. |
| Browse Barcelona | Explora Barcelona | Explorar Barcelona |

---

## 29. Programs detail enrichment (Tier 2 · locked 2026-06-17)

Public learner-facing Program-detail surfaces (keys `prog_pub_*`, extending §24). `{year}`/`{n}` interpolate. The host meta uses the brand word "rooms" (*sales / salas*) for events hosted. "Quiet questions" is a static, program-agnostic 3-Q FAQ (honest + generic — per-program FAQ would need a host field, deferred). The "Host" badge marks host replies in the read-only neighbour Q&A. Deferred to later slices: hero image, host-entered "what's included", rating, Founding-host chip, cohort/spots/enrol bar, cert "See sample"/public `/v/{slug}`, the voices aggregate footnote, and the Q&A ask/answer composer.

| EN | CA | ES |
|---|---|---|
| Hosting since {year} · {n} rooms | Acull des de {year} · {n} sales | Anfitrión/a desde {year} · {n} salas |
| Host | Amfitrió/a | Anfitrión/a |
| Quiet questions | Preguntes tranquil·les | Preguntas tranquilas |
| What if I miss a week? | I si em perdo una setmana? | ¿Y si me pierdo una semana? |
| One miss is usually fine — talk to your host about making it up. | Una absència sol estar bé — parla amb l'amfitrió/a per recuperar-la. | Una ausencia suele estar bien — habla con tu anfitrión/a para recuperarla. |
| New to it? | Comences de zero? | ¿Empiezas de cero? |
| Most cohorts are half first-timers — you'll be in good company. | La meitat de cada cohort són principiants — hi estaràs ben acompanyat/da. | La mitad de cada cohorte son principiantes — estarás en buena compañía. |
| Refund? | Reemborsament? | ¿Reembolso? |
| Refund terms are set by the host — ask before you enrol. | Les condicions les fixa l'amfitrió/a — pregunta abans d'inscriure't. | Las condiciones las fija el anfitrión/a — pregunta antes de inscribirte. |

---

## 30. Memory Capsule enrichment (Tier 2 · locked 2026-06-17)

The Capsule screen's enriched surfaces (key `cap_*`, extending §21). `{x}`/`{y}` interpolate (shared-both / Circle members). Photo roll becomes a grid; "the difference" gets a featured-pair + mini-pairs hierarchy; "Your Circle" gets member avatars. The difference footnote is **counts only — no skipper names** (honours §21's "silent, not stigmatised": absence is never represented). Deferred: full-screen photo gallery, per-pair quote (no data field), avg-rating (reviews, Tier 3), next-bookings (no data source), "next event together" line.

| EN | CA | ES |
|---|---|---|
| {x} of {y} in the Circle shared both photos. | {x} de {y} del Cercle van compartir totes dues fotos. | {x} de {y} del Círculo compartieron ambas fotos. |

---

## 31. Event-discovery filters (Tier 2 · locked 2026-06-17)

Filter chips on the events feed (keys `fil_*`). EVENT discovery only — people-discovery + its filters were cut in Pass 40. The when-chips are single-select and map to `dateFrom`/`dateTo` on the existing `/events` query: **Anytime = upcoming-only** (`dateFrom = now`, which also stops past events leaking into the feed), This week = now…+7d, Weekend = the next Sat–Sun. Barri chips (single-select) re-query with `neighbourhood`; the barri names themselves are data, not locked copy. "Barrios" matches the locked EN spelling (§4). Skipped this pass: price (free/paid), weekday, time-of-day, full From/To calendar.

| EN | CA | ES |
|---|---|---|
| Anytime | Qualsevol dia | Cualquier día |
| This week | Aquesta setmana | Esta semana |
| Weekend | Cap de setmana | Fin de semana |
| All barrios | Tots els barris | Todos los barrios |

---

## 32. Home Programs strip (Tier 2 · locked 2026-06-17)

Enriching the Home Programs strip (keys `prog_pub_*`). The eyebrow is the already-locked §24 `prog_pub_eyebrow` ("Programs. Where craft becomes your way.") — split at the first `". "` into a bold-ink label + an italic-coral tagline, prefixed with a grad-cap icon in a gold circle; no new eyebrow copy. Per-card meta surfaces `timeFrameSessions` as **weeks** (singular form when n = 1). A gold "more programs" arrow card ends the strip → `/programs/browse`. The trust line gains a "How it works →" link (reusing `prog_pub_howItWorks`) → a brief "coming soon" (verification flow is Tier 3). Price/cohort deferred (no data until the enrolment slice).

| key | EN | CA | ES |
|---|---|---|---|
| `prog_pub_weeks` (n ≠ 1) | {n} weeks | {n} setmanes | {n} semanas |
| `prog_pub_week` (n = 1) | {n} week | {n} setmana | {n} semana |
| `prog_pub_moreCard` | More programs | Més programes | Más programas |

---

## 33. Auth — Google sign-in (locked 2026-06-16)

The sign-in button on Profile (staging onward — Google is the only sign-in; the dev paste box is `__DEV__`-only). Mirrored in `incircleme-mvp/packages/i18n` (`signInWithGoogle`). ES uses the infinitive to match the locked §15 *Entrar*. *(Renumbered from §25 during the staging→main rebase — main had already taken §25–§32.)*

| EN | CA | ES |
|---|---|---|
| Sign in with Google | Entra amb Google | Entrar con Google |

---

## 34. Ticket screen (Tier 2 · locked 2026-06-20)

The booking ticket screen (Ticket+Circle brief 2026-06-19). Mirrored in `packages/i18n` (`ticket_*`). Approved by Alina **as-is**: `ticket_admitOne` stays **singular** ("Admit 1" — one ticket per booking in the MVP), and the util line (Wallet / Share / Calendar / Directions) is **icon-only** — no labels locked. `{event}` / `{host}` / `{amount}` interpolate; the cancel sub-line carries the "no impact on your Passport" promise. Currency follows the locked rule (EN €25 · CA/ES 25 €).

| key | EN | CA | ES |
|---|---|---|---|
| `ticket_title` | Your ticket | La teva entrada | Tu entrada |
| `ticket_subtitle` | confirmation · show at the door | confirmació · ensenya-la a l'entrada | confirmación · enséñala en la puerta |
| `ticket_badgeConfirmed` | Confirmed | Confirmada | Confirmada |
| `ticket_startsIn` | starts in | comença en | empieza en |
| `ticket_remind` | We'll remind you 24h ahead | T'avisem 24 h abans | Te avisamos 24 h antes |
| `ticket_showAtDoor` | Show at the door | Ensenya-la a l'entrada | Enséñala en la puerta |
| `ticket_admitOne` | Admit 1 | Admet 1 | Admite 1 |
| `ticket_detailsTitle` | The details | Els detalls | Los detalles |
| `ticket_detailsDatetime` | Date & time | Data i hora | Fecha y hora |
| `ticket_detailsLocation` | Location | Ubicació | Ubicación |
| `ticket_detailsSmallGroup` | Small group | Grup reduït | Grupo reducido |
| `ticket_detailsPaid` | Paid | Pagat | Pagado |
| `ticket_circleActive` | Circle is active | El Cercle és actiu | El Círculo está activo |
| `ticket_late` | Running late? | Fas tard? | ¿Llegas tarde? |
| `ticket_cancelCta` | Cancel this booking | Cancel·la la reserva | Cancelar la reserva |
| `ticket_cancelSub` | refund per the host's policy · no impact on your Passport | reemborsament segons la política de l'amfitrió/ona · sense impacte al teu Passaport | reembolso según la política del anfitrión/a · sin impacto en tu Pasaporte |
| `ticket_footer` | Your Circle is counting on you | El teu Cercle compta amb tu | Tu Círculo cuenta contigo |

---

## 35. Reviews flow + vibe tags (Tier 2 · locked 2026-06-20)

The reviews flow (Reviews brief 2026-06-19). Mirrored in `packages/i18n` (`vibe_*`, `rev_*`, `bk_leaveReview`, `cap_avgRating`/`cap_wouldGo`). **"Would you go again?"** (`rev_wouldGoAgain`) is an **explicit yes/no** the reviewer taps — never derived from the star rating. The six **vibe tags** are the selectable chips (canonical keys in `packages/config`). Public sharing is **off by default** (`rev_sharePublic*`). `cap_avgRating`/`cap_wouldGo` surface the reviews aggregate on the Memory Capsule highlights. CTAs: CA imperative (Comparteix / Envia-ho) · ES infinitive (Compartir / Enviar). `{event}`/`{host}`/`{avg}`/`{n}` interpolate.

| key | EN | CA | ES |
|---|---|---|---|
| `vibe_warmWelcome` | Warm welcome | Benvinguda càlida | Bienvenida cálida |
| `vibe_wellOrganised` | Well organised | Ben organitzat | Bien organizado |
| `vibe_smallGroup` | Small group felt right | El grup reduït anava bé | El grupo reducido iba bien |
| `vibe_beautifulSpace` | Beautiful space | Espai bonic | Espacio bonito |
| `vibe_easyToMeet` | Easy to meet people | Fàcil conèixer gent | Fácil conocer gente |
| `vibe_feltIncluded` | Felt included | M'hi vaig sentir inclòs/osa | Me sentí incluido/a |
| `rev_promptTitle` | Share how it felt | Comparteix com va anar | Comparte cómo fue |
| `rev_promptSub` | Only the host sees this by default | Només l'amfitrió/ona ho veu, per defecte | Solo el anfitrión/a lo ve, por defecto |
| `rev_memoryFrom` | Memory from | Record de | Recuerdo de |
| `rev_inviteQ` | How was your time at {event}? | Com va anar a {event}? | ¿Cómo fue en {event}? |
| `rev_inviteSub` | {host} reads every word. Your review stays private between you two — unless you choose to share it on the event page. | {host} llegeix cada paraula. La teva ressenya queda privada entre vosaltres — tret que decideixis compartir-la a la pàgina de l’esdeveniment. | {host} lee cada palabra. Tu reseña queda privada entre vosotros — salvo que decidas compartirla en la página del evento. |
| `rev_maybeLater` | Maybe later | Potser més tard | Quizá más tarde |
| `rev_noReminders` | No reminders. We'll ask once, then leave it alone. Promise. | Sense recordatoris. T’ho preguntem un cop i prou. Promès. | Sin recordatorios. Te lo preguntamos una vez y ya está. Prometido. |
| `rev_rateTitle` | Rating | Valoració | Valoración |
| `rev_overallQ` | Overall, how did it feel? | En general, com et va fer sentir? | En general, ¿cómo te hizo sentir? |
| `rev_tapStar` | Tap a star to begin | Toca una estrella per començar | Toca una estrella para empezar |
| `rev_stoodOutQ` | What stood out? | Què va destacar? | ¿Qué destacó? |
| `rev_optional` | Optional | Opcional | Opcional |
| `rev_hearQ` | Anything you'd like {host} to hear? | Vols dir alguna cosa a {host}? | ¿Quieres decirle algo a {host}? |
| `rev_commentPlaceholder` | A sentence is plenty. What made it feel like yours? | Amb una frase n’hi ha prou. Què el va fer teu? | Con una frase basta. ¿Qué lo hizo tuyo? |
| `rev_sharePublic` | Also share on the event page | Comparteix-ho també a la pàgina de l’esdeveniment | Compartir también en la página del evento |
| `rev_sharePublicSub` | Off by default. Turn on if you'd like future attendees to see your review. | Desactivat per defecte. Activa’l si vols que els futurs assistents la vegin. | Desactivado por defecto. Actívalo si quieres que los futuros asistentes la vean. |
| `rev_wouldGoAgain` | Would you go again? | Tornaries a venir? | ¿Volverías? |
| `rev_yes` | Yes | Sí | Sí |
| `rev_no` | No | No | No |
| `rev_send` | Send to {host} | Envia-ho a {host} | Enviar a {host} |
| `rev_thanksTitle` | {host} will see this — thank you. | {host} ho veurà — gràcies. | {host} lo verá — gracias. |
| `rev_thanksSub` | Reviews are how small hosts get better. And how our community keeps its shape. | Les ressenyes són com els amfitrions petits milloren. I com la comunitat manté la seva forma. | Las reseñas son cómo los anfitriones pequeños mejoran. Y cómo la comunidad mantiene su forma. |
| `rev_passportNudge` | +1 review earned on your Passport | +1 ressenya al teu Passaport | +1 reseña en tu Pasaporte |
| `rev_passportNudgeSub` | Hosts can see it when you book. | Els amfitrions ho veuen quan reserves. | Los anfitriones lo ven cuando reservas. |
| `rev_similar` | Events with a similar feel this week | Esdeveniments amb un aire semblant aquesta setmana | Eventos con un aire parecido esta semana |
| `rev_keepExploring` | Keep exploring | Segueix explorant | Seguir explorando |
| `rev_backToBookings` | Back to My Bookings | Torna a les meves reserves | Volver a mis reservas |
| `rev_privateNote` | Your review is private to {host}. You didn’t turn on public sharing — only she will read it. | La teva ressenya és privada per a {host}. No has activat la compartició pública — només ella la llegirà. | Tu reseña es privada para {host}. No activaste la compartición pública — solo ella la leerá. |
| `bk_leaveReview` | Leave a review | Deixa una ressenya | Dejar una reseña |
| `cap_avgRating` | Avg rating | Valoració mitjana | Valoración media |
| `cap_wouldGo` | {n} would go again | {n} hi tornarien | {n} volverían |

---

## 36. Reputation Passport (Tier 2 · locked 2026-06-20)

The Reputation Passport screen (Passport brief 2026-06-19). Mirrored in `packages/i18n` (`pp_*`). **Self-only** screen — per the §7 split, the tier **word** shows to others but the **numbers** only to self. Trait scores and badges are honest stubs (`pp_traitsSoon` / `pp_badgesSoon`) until those signals are computed. The body says **"Program"** (the live multi-week concept is Programs — there is no Ritual feature). `{avg}`/`{again}`/`{incl}`/`{n}` interpolate.

| key | EN | CA | ES |
|---|---|---|---|
| `pp_reliable` | Reliable | Fiable | Fiable |
| `pp_hospitable` | Hospitable | Hospitalari/ària | Hospitalario/a |
| `pp_curious` | Curious | Curiós/osa | Curioso/a |
| `pp_traitsSoon` | Trait scores are coming soon | Les puntuacions de trets arriben aviat | Las puntuaciones de rasgos llegan pronto |
| `pp_scoreBuilt` | How your score is built | Com es construeix la teva puntuació | Cómo se construye tu puntuación |
| `pp_reviewsReceived` | Reviews received | Ressenyes rebudes | Reseñas recibidas |
| `pp_reviewsSub` | {avg} avg · {again} would go again · {incl} felt included | {avg} de mitjana · {again} repetirien · {incl} s’hi van sentir inclosos | {avg} de media · {again} repetirían · {incl} se sintieron incluidos |
| `pp_circlesActive` | Active Circles | Cercles actius | Círculos activos |
| `pp_contributions` | Contributions | Contribucions | Contribuciones |
| `pp_contributionsSub` | {n} reviews written for others | {n} ressenyes escrites per a altres | {n} reseñas escritas para otros |
| `pp_badges` | Badges | Insígnies | Insignias |
| `pp_badgesSoon` | More badges on the way | Més insígnies en camí | Más insignias en camino |
| `pp_whyMatters` | Why this matters | Per què importa | Por qué importa |
| `pp_whyMattersBody` | Your Passport travels with you across every event, Circle and Program. Hosts see it before accepting your booking. Higher levels unlock priority access and hosting privileges. | El teu Passaport et segueix per cada esdeveniment, Cercle i Programa. Els amfitrions el veuen abans d’acceptar la teva reserva. Els nivells alts desbloquegen accés prioritari i privilegis per organitzar. | Tu Pasaporte te acompaña en cada evento, Círculo y Programa. Los anfitriones lo ven antes de aceptar tu reserva. Los niveles altos desbloquean acceso prioritario y privilegios para organizar. |
| `pp_privateDefault` | Private by default | Privat per defecte | Privado por defecto |
| `pp_levelUp` | How to level up | Com pujar de nivell | Cómo subir de nivel |
| `pp_privacy` | Privacy | Privacitat | Privacidad |

---

## 37. Public host/creator profile (Tier 2 · locked 2026-06-20)

Section labels on the public host profile (`/u/:id`). Mirrored in `packages/i18n` (`up_*`). **"Keep close" stays §1** (parked) — the affordance was removed from the live UI (people layer retired in Pass 40); the verb is reserved for later, so it is **not** re-locked here. "Their rooms" uses the brand word **rooms / sales / salas**.

| key | EN | CA | ES |
|---|---|---|---|
| `up_about` | About | Presentació | Presentación |
| `up_theirEvents` | Their rooms | Les seves sales | Sus salas |
| `up_reputation` | Reputation | Reputació | Reputación |
| `up_report` | Report | Denuncia | Denunciar |

---

## 38. Onboarding (locked 2026-06-22)

The sign-in-FIRST flow: welcome → sign in → intent → interests → barrio → notifications → home. Mirrored in `packages/i18n` (`onb_*`, 78 keys, CA·ES·EN). CTAs follow the lock (CA imperative / ES infinitive). The "nearby" consent line uses the **Keep close** connection verb — never "follow". Columns read CA · ES · EN.

### Step indicator / common
| key | CA | ES | EN |
|---|---|---|---|
| `onb_stepOf` | Pas {n} de {total} | Paso {n} de {total} | Step {n} of {total} |
| `onb_back` | Enrere | Atrás | Back |

### Welcome
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

### Sign in (NEW — sign-in-first; not from prototype)
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

### Intent (6 tiles · NO identity chips)
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

### Interests (canonical 6 + "I'm here to…")
| key | CA | ES | EN |
|---|---|---|---|
| `onb_interests_title` | Què faria que aquesta setmana se sentís viva? | ¿Qué haría que esta semana se sintiera viva? | What would make this week feel alive? |
| `onb_interests_sub` | Tria’n almenys 3 que t’estirin. | Elige al menos 3 que te tiren. | Pick at least 3 that pull you. |
| `onb_interests_continue` | Continua | Continuar | Continue |
| `onb_interests_footer` | Sense pressa — ho pots repensar més tard. | Sin presión — puedes repensarlas más tarde. | No pressure — you can rethink these later. |
| `onb_interests_need` *(addendum 2026-06-24)* | Tria’n {n} més | Elige {n} más | Pick {n} more |
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

### Barrio (10 + not-listed + waitlist)
| key | CA | ES | EN |
|---|---|---|---|
| `onb_barrio_title` | Quin barri sents com a casa? | ¿Qué barrio sientes como tu casa? | Which barrio do you call home? |
| `onb_barrio_sub` | Et mantindrem el feed a peu. | Mantendremos tu feed a pie. | We’ll keep your feed walkable. |
| `onb_barrio_continue` | Continua | Continuar | Continue |
| `onb_barrio_notListed` | El meu barri no hi és | Mi barrio no está en la lista | My barrio isn’t on the list |
| `onb_barrio_waitlist` | Encara no ets a Barcelona? T’escriurem quan arribem a la teva ciutat. Barcelona és on arrelem primer. | ¿Aún no estás en Barcelona? Te escribiremos cuando lleguemos a tu ciudad. Barcelona es donde echamos raíces primero. | Not in Barcelona yet? We’ll write when we arrive in your city. Barcelona is where we grow roots first. |
| `onb_barrio_*` (names) | Eixample · Gràcia · El Born · Gòtic · Sant Antoni · Poblenou · Barceloneta · El Raval · Sants · Sarrià | *(same — Catalan)* | *(same — Catalan)* |

### Notifications consent
| key | CA | ES | EN |
|---|---|---|---|
| `onb_notif_title` | Només quan passa alguna cosa de debò. | Solo cuando pasa algo de verdad. | Only when something real happens. |
| `onb_notif_sub` (promise) | Res de màrqueting. Res d’empentes. Res de «t’enyorem». | Nada de marketing. Nada de empujones. Nada de «te echamos de menos». | No marketing. No growth nudges. No “we miss you” pings. |
| `onb_notif_bookings` / `_sub` | Les teves reserves / La nit abans, el matí mateix i qualsevol canvi. Aquestes les vols. | Tus reservas / La noche antes, la mañana misma y cualquier cambio. Estas las quieres. | Your bookings / The night before, the morning of, and anything that changes. You want these. |
| `onb_notif_bookings_always` | Sempre actiu | Siempre activo | Always on |
| `onb_notif_circles` / `_sub` | Els teus Cercles / Quan algú del teu grup publica — una foto, un gràcies, un pla per a la propera. | Tus Círculos / Cuando alguien de tu grupo publica — una foto, un gracias, un plan para la próxima. | Your Circles / When someone in your small group chat posts — a photo, a thank-you, a plan for next time. |
| `onb_notif_nearby` / `_sub` | Nou al teu barri / Un grapat per setmana — només de qui mantens a prop o vibracions que has triat. Mai una allau. | Nuevo en tu barrio / Un puñado por semana — solo de quien mantienes cerca o vibras que has elegido. Nunca una avalancha. | New in your neighbourhood / A handful per week — only from creators you keep close or vibes you picked. Never a flood. |
| `onb_notif_settings` | Ho pots canviar quan vulguis a Configuració. | Puedes cambiarlo cuando quieras en Ajustes. | You can change this any time in Settings. |
| `onb_notif_cta` | Em sembla bé | Me parece bien | That sounds good |
| `onb_notif_minimal` | Ho deixo al mínim — només reserves | Lo dejo al mínimo — solo reservas | I’ll keep it minimal — bookings only |

---

## 39. Settings & Account (locked 2026-06-22)

Settings hub, in-app language picker (CA/ES/EN, applies live + persists), edit profile, and the warm **reversible** Deactivate flow (no "deleted"/scare wording — reactivates on next sign-in). Mirrored in `packages/i18n` (`set_*` · `ep_*` · `da_*`, 35 keys, CA·ES·EN). Notifications are live against `notification_prefs`. Columns read CA · ES · EN.

### Settings hub
| key | CA | ES | EN |
|---|---|---|---|
| `set_title` | Configuració | Ajustes | Settings |
| `set_notifications` | Notificacions | Notificaciones | Notifications |
| `set_language` | Idioma | Idioma | Language |
| `set_account` | Compte | Cuenta | Account |
| `set_legalSection` | Privadesa i condicions | Privacidad y condiciones | Privacy & terms |
| `set_editProfile` | Edita el perfil | Editar perfil | Edit profile |
| `set_deactivate` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `set_privacyPolicy` | Política de privadesa | Política de privacidad | Privacy Policy |
| `set_terms` | Condicions | Condiciones | Terms |
| `set_lang_ca` / `set_lang_es` / `set_lang_en` | Català · Español · English | *(same)* | *(same)* |

### Notifications (live — backed by notification_prefs)
| key | CA | ES | EN |
|---|---|---|---|
| `set_notif_bookings` | Les teves reserves | Tus reservas | Your bookings |
| `set_notif_circles` | Els teus Cercles | Tus Círculos | Your Circles |
| `set_notif_nearby` | Nou al teu barri | Nuevo en tu barrio | New in your neighbourhood |
| `set_notif_always` | Sempre actiu | Siempre activo | Always on |
| `set_notifManaged` | Els vas triar a l’onboarding. Els controls complets arriben quan s’activin. | Las elegiste en el onboarding. Los controles completos llegan cuando se activen. | You picked these during onboarding. Full controls arrive when it ships. |

### Edit profile
| key | CA | ES | EN |
|---|---|---|---|
| `ep_title` | Edita el perfil | Editar perfil | Edit profile |
| `ep_photo` | Foto | Foto | Photo |
| `ep_changePhoto` | Canvia la foto | Cambiar la foto | Change photo |
| `ep_name` | Nom | Nombre | Name |
| `ep_namePlaceholder` | El teu nom | Tu nombre | Your name |
| `ep_bio` | Sobre tu | Sobre ti | About you |
| `ep_bioPlaceholder` | Una frase sobre tu | Una frase sobre ti | A line about you |
| `ep_barrio` | Barri | Barrio | Barrio |
| `ep_barrioPlaceholder` | El teu barri | Tu barrio | Your barrio |
| `ep_language` | Idioma | Idioma | Language |
| `ep_save` | Desa | Guardar | Save |
| `ep_saved` | Desat | Guardado | Saved |

### Deactivate (warm · reversible)
| key | CA | ES | EN |
|---|---|---|---|
| `da_title` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `da_body` | El teu compte i tot el que has construït es queden tal com estan. Desapareixeràs del públic i no podràs reservar ni organitzar mentrestant. | Tu cuenta y todo lo que has construido se quedan como están. Desaparecerás de lo público y no podrás reservar ni organizar mientras tanto. | Your account and everything you’ve built stay exactly as they are. You’ll disappear from public view and can’t book or host in the meantime. |
| `da_reversible` | Pots tornar quan vulguis — només cal tornar a entrar. | Puedes volver cuando quieras — solo vuelve a entrar. | You can come back any time — just sign in again. |
| `da_confirm` | Desactiva el compte | Desactivar la cuenta | Deactivate account |
| `da_cancel` | Ara no | Ahora no | Not now |
| `da_done` | El teu compte està desactivat. T’esperem. | Tu cuenta está desactivada. Te esperamos. | Your account is deactivated. We’ll keep your seat warm. |

---

## 40. Live screens — Profile · Events category · free price (locked 2026-06-25)

Profile identity/about/share + barrio label, the Events-category empty state and filter pills, and the free-price label. Mirrored in `packages/i18n` (`fil_*` · `cat_*` · `ev_free` · `prof_*`, 12 keys, CA·ES·EN). `prof_edit` is intentionally absent — the profile Edit action reuses `set_editProfile`. Columns read CA · ES · EN.

### Events filters
| key | CA | ES | EN |
|---|---|---|---|
| `fil_all` | Tot | Todo | All |
| `fil_weekday` | Entre setmana | Entre semana | Weekday |
| `fil_free` | Gratis | Gratis | Free |
| `fil_paid` | De pagament | De pago | Paid |

### Events — empty state + free price
| key | CA | ES | EN |
|---|---|---|---|
| `ev_free` | Gratis | Gratis | Free |
| `cat_emptyTitle` | Encara no hi ha res en aquesta categoria. | Todavía no hay nada en esta categoría. | Nothing in this category yet. |
| `cat_emptySub` | Estem omplint Barcelona barri a barri. Prova un altre filtre o torna aviat. | Estamos llenando Barcelona barrio a barrio. Prueba otro filtro o vuelve pronto. | We’re filling Barcelona barri by barri. Try another filter or check back soon. |
| `cat_emptyCta` | Mostra-ho tot | Ver todo | See everything |

### Profile
| key | CA | ES | EN |
|---|---|---|---|
| `prof_nameFallback` | Membre d’IncircleMe | Miembro de IncircleMe | IncircleMe member |
| `prof_share` | Comparteix | Compartir | Share |
| `prof_shareMessage` | {name} és a IncircleMe — Barcelona en petit comitè. | {name} está en IncircleMe — Barcelona en petit comité. | {name} is on IncircleMe — Barcelona in small rooms. |
| `prof_aboutEmpty` | Encara no has escrit res sobre tu. | Aún no has escrito nada sobre ti. | You haven’t added a bio yet. |

---

*Voice locked. Vocabulary locked. Translation contract written. The next room can speak.*
