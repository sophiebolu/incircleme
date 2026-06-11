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

*Voice locked. Vocabulary locked. Translation contract written. The next room can speak.*
