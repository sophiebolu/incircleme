# IncircleMe — Engineering Handoff

**Original date:** 2026-04-27 · **Last revised:** 2026-06-10 (Pass 40 cuts applied in place)
**For:** Romain (Lead Engineer) · Codex / Claude Code (autonomous build agent)
**From:** Alina (Founder · Product) + Claude (frontend / design partner)
**Prototype state (as of revision):** md5 `7673049...` · ~616 KB · 46 screens · Pass 40G shipped
**Status:** Frontend prototype complete enough to start backend. No GitHub push has been made yet — `_deploy/index.html` is the canonical mirror waiting for Alina's go-ahead.

---

## 🔴 Read this first — Pass 40 simplification banner

**On 2026-06-10 Alina narrowed the product scope to Events + Programs only.** People-discovery is OUT. This document was originally written before that decision; sections marked with `~~strikethrough~~ — REMOVED in Pass 40` are no longer in scope. **Do not implement** anything tagged that way.

**The fastest way to know what's in scope:** read `Codex-Brief-2026-06-10.md` at the workspace root first. That brief is the simplified, authoritative scope. This Handoff is the deep reference for everything the brief points to.

---

## Read this first (orientation)

This document is the bridge from the HTML prototype (which is rich and opinionated) to a real working backend. The prototype is the source of truth for visual design, interaction patterns, copy, and the editorial voice. This handoff translates those into data models, API contracts, and an MVP build slice.

Read in this order:

1. `Codex-Brief-2026-06-10.md` at workspace root (simplified scope)
2. This handoff (deep reference)
3. `01-Product/Catalan_Vocabulary_Lock.md` (locked copy, do not paraphrase)
4. The prototype HTML at `IncircleMe-v3/index.html` (open in Chrome, click through every screen)
5. The strategy memories — *Strategy Framework*, *Pricing Model*, *Retention Loops* (in Alina's auto-memory)

If you only read one thing, read the prototype.

---

## What we are building

IncircleMe is a hyperlocal events marketplace for Barcelona, designed around small rooms (4–12 people) hosted by real humans (yoga teachers, ceramicists, language exchange leads). The product principle is **emotion before mechanics**: the booking flow is incidental; what matters is the room, the people, the after.

The moat is **Circles** — every event becomes a private group chat for its attendees, and Circles can vote to "keep going" past a single event into a recurring micro-community. The Circle is the conversation, not the comment thread.

Two unique features that no other events platform has:

- **Memory Capsule** — auto-generated, Circle-only, stays forever. Photos, quotes, attendance.
- **Arriving feature** (Pass 34) — pre-event mood photo + post-event mood photo + side-by-side "the difference" view in the Capsule. This is the signature.

Editorial voice is the differentiator. *"Small rooms"* not "intimate gatherings." *"Keep close"* not "follow." *"Walking in"* not "attending." See the Catalan vocabulary lock for the full list.

---

## Tech stack — recommendation

Pick the boring, proven choices. We are not solving novel infra problems.

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend (mobile) | React Native + Expo | iOS + Android from one codebase. Expo for OTA updates during early Barcelona beta. |
| Frontend (web) | Next.js 14 (App Router) | SSR for SEO, React Server Components for performance. |
| Backend | Node.js + Fastify (or NestJS for structure) | Single language across stack. Fastify if speed matters; NestJS if team prefers structure. |
| Database | PostgreSQL 16 | JSONB for flexible fields (intent chips, vibe), strong relational base. |
| Cache + queues | Redis | Sessions, rate limiting, BullMQ for scheduled jobs. |
| Storage | Cloudflare R2 (or S3) | Photos, signed URLs, expiring objects. R2 has zero egress fees. |
| Auth | Auth0 or self-hosted (Lucia + JWT) | Social login + magic link + WebAuthn. |
| Payments | Stripe Connect (Express accounts) | Creator payouts, EU compliance, KYC built-in. |
| Real-time | WebSocket (Socket.io or native) | Circle chat, live attendance updates. |
| Push | Expo Push (native) + Web Push | Scheduled at T-6h and T+30min for Arriving. |
| Hosting | Fly.io (app) + Cloudflare (CDN, R2) | Edge presence in Madrid + Frankfurt for low-latency Spain. |
| Monitoring | Sentry (errors) + Grafana Cloud (metrics) + PostHog (product analytics) | Three pillars: errors, perf, product. |
| Infra-as-code | Terraform (Cloudflare + Fly) + GitHub Actions CI/CD | Boring, audited. |

If Romain prefers Go or Python on the backend, that's fine — the contracts in this doc are language-agnostic.

---

## Data model

Tables below are the MVP minimum. Soft-delete everywhere (project rule: never hard-delete). All timestamps UTC, stored as `timestamptz`. IDs are UUIDv7 (sortable + unique).

### `users`

```
id              uuid PK
email           citext unique
phone           text nullable
display_name    text
handle          text unique
avatar_url      text nullable
bio             text nullable
neighbourhood   text nullable           -- "Gràcia", "Eixample", etc.
verified        boolean default false   -- ID verification state
language        text default 'ca'       -- 'ca' | 'es' | 'en'
joined_at       timestamptz
last_seen_at    timestamptz             -- drives lapsed-user welcome-back
trust_tier      text default 'newcomer' -- newcomer | regular | trusted | pillar | founding
trust_score     int default 0
deleted_at      timestamptz nullable
```

### ~~`user_intents`~~ — REMOVED in Pass 40 (2026-06-10)

Identity declarations were removed when Alina narrowed the scope to Events + Programs only. People filters are gone with the people-discovery cut. **Do not implement this table.**

### `events`

```
id                   uuid PK
host_user_id         uuid FK users
title                text
description          text
category             text  -- food_drink | wellness | art_craft | music | nature | learning
neighbourhood        text  -- "Gràcia", etc.
address              text  -- unlocks T-1 day
address_locked       boolean default true
starts_at            timestamptz
ends_at              timestamptz
duration_minutes     int
seat_count           int
seats_held           int default 0  -- by deposit holds
seats_booked         int default 0
price_cents          int
currency             text default 'EUR'
photo_urls           text[]
arriving_enabled     boolean default true   -- host toggle (Pass 34)
boost_until          timestamptz nullable   -- paid promo
deposit_required     boolean default false  -- creator-optional €5 hold
created_at           timestamptz
deleted_at           timestamptz nullable
```

### `circles`

One Circle per Event. Auto-created on first booking confirmation.

```
id              uuid PK
event_id        uuid FK events unique  -- one-to-one with events
opens_at        timestamptz             -- 48h before event
closes_at       timestamptz             -- 48h after, OR forever if kept
kept_at         timestamptz nullable    -- when afterlife vote passed
member_count    int
created_at      timestamptz
```

### `circle_members`

```
circle_id       uuid FK circles
user_id         uuid FK users
role            text  -- host | attendee | friend
joined_at       timestamptz
left_at         timestamptz nullable
PRIMARY KEY (circle_id, user_id)
```

### `circle_messages`

```
id              uuid PK
circle_id       uuid FK circles
user_id         uuid FK users
body            text
attachments     jsonb  -- {type: 'photo' | 'arriving' | 'leaving', url, expires_at}
created_at      timestamptz
deleted_at      timestamptz nullable
```

### `arriving_moments`

The Pass 34 signature feature.

```
id              uuid PK
event_id        uuid FK events
user_id         uuid FK users
state           text  -- 'before' | 'after'
photo_url       text
chat_expires_at timestamptz  -- T+48h after event end
taken_at        timestamptz
deleted_at      timestamptz nullable
UNIQUE (event_id, user_id, state)
```

### `bookings`

```
id              uuid PK
event_id        uuid FK events
user_id         uuid FK users
status          text  -- held | confirmed | cancelled | refunded
seat_count      int default 1
amount_cents    int
deposit_cents   int default 0  -- creator-optional €5 hold
stripe_pi_id    text  -- Stripe PaymentIntent
held_until      timestamptz nullable  -- 5-min hold for card-declined recovery
booked_at       timestamptz
checked_in_at   timestamptz nullable  -- QR check-in
cancelled_at    timestamptz nullable
```

### ~~`kept_close`~~ — REMOVED in Pass 40

Keep-close relationship was removed when Alina cut people-discovery from the app. **Do not implement.**

### ~~`go_together_requests`~~ — REMOVED in Pass 40

Go-together CTA was removed from the app. **Do not implement.**

### `direct_messages` (simplified after Pass 40)

1:1 chat threads. **Pass 40 simplification: unlock is gated by shared-event attendance only.** No Go-together handshake, no permanent-unlock metadata. A DM thread becomes available between users A and B once both have attended (checked-in to) the same event. After the shared event the thread stays open as long as both users want it — but it is created at attendance time, not after a request flow.

```
thread_id       uuid PK
participant_a   uuid FK users
participant_b   uuid FK users
opened_at       timestamptz       -- when the thread became available (post-attendance check-in)
context_event   uuid FK events    -- the first shared event that opened this thread
last_msg_at     timestamptz
UNIQUE (LEAST(participant_a, participant_b), GREATEST(participant_a, participant_b))
```

### `reviews`

Post-event reviews. Drive trust score.

```
id              uuid PK
event_id        uuid FK events
reviewer_id     uuid FK users
host_id         uuid FK users
rating          int  -- 1 to 5
body            text
created_at      timestamptz
deleted_at      timestamptz nullable
```

### `notifications`

```
id              uuid PK
user_id         uuid FK users
type            text  -- arriving_pre | arriving_post | difference_ready | circle_msg | booking_confirm | booking_remind | review_request
payload         jsonb
read_at         timestamptz nullable
sent_at         timestamptz
```

### `creator_payouts`

```
id                  uuid PK
host_user_id        uuid FK users
stripe_account_id   text
event_id            uuid FK events
gross_cents         int
platform_fee_cents  int  -- v2 pricing: 5% basic, 2% pro, 0% premium
net_cents           int
payout_at           timestamptz nullable
state               text  -- pending | paid | held
```

### `programs` (Sprint 45 — Premium credentialling)

The verifiable unit behind every certificate.

```
id                       uuid PK
host_user_id             uuid FK users
title                    text
description              text
curriculum               jsonb  -- modules, skills, hours
time_frame_sessions      int
time_frame_total_hours   numeric
assessment_method        text
accreditation_body       text nullable  -- "Yoga Alliance", "Cambridge English", etc.
accreditation_id         text nullable  -- the host's ID with that body
references               jsonb  -- [{name, role, contact, verified_at}]
status                   text  -- draft | submitted | pending_review | verified | under_review | rejected
verified_at              timestamptz nullable
verified_by              uuid FK users nullable  -- internal trust team member
rejection_reason         text nullable
submission_fee_cents     int default 15000  -- €150 default; founding hosts have 0
submitted_at             timestamptz
deleted_at               timestamptz nullable
```

### `program_credentials`

```
id              uuid PK
program_id      uuid FK programs
file_url        text  -- R2 signed URL of uploaded credential
file_kind       text  -- diploma | license | accreditation | reference_letter
verified_at     timestamptz nullable
notes           text nullable
```

### `certificates` (Sprint 45)

```
id                  uuid PK
program_id          uuid FK programs nullable  -- nullable for self-issued (Pro tier)
event_id            uuid FK events
host_user_id        uuid FK users
recipient_user_id   uuid FK users
kind                text  -- attendance | completion | achievement
grade               text nullable  -- "B1 / 87%" for achievement kind
verification_tier   text  -- self_issued | verified_program | accredited_program
public_slug         text unique  -- /v/{slug} verification URL
pdf_url             text  -- R2 permanent signed URL
issued_at           timestamptz
revoked_at          timestamptz nullable
revoked_reason      text nullable
```

Public verification endpoint: `GET /v/{public_slug}` — read-only, anyone can hit. Returns recipient profile + program detail + verification tier + issued date.

### `business_review_snapshots` (Sprint 46)

Pre-aggregated nightly so the Business tab and quarterly PDF are fast.

```
creator_id              uuid FK users
period_start            date
period_end              date
events_count            int
attendees_count         int
checked_in_attendees    int  -- the metric that counts toward founding-host bar
gmv_cents               bigint
platform_fee_cents      bigint
net_to_host_cents       bigint
kept_circles_count      int
avg_rating              numeric(3,2)
repeat_attendees_count  int
fill_rate               numeric(5,4)
arriving_completion_rate numeric(5,4)  -- new metric tied to the Arriving feature
PRIMARY KEY (creator_id, period_start, period_end)
```

### `category_benchmarks` (Sprint 46)

Refreshed weekly. Powers the Premium peer-benchmarks section.

```
category               text
city                   text
period_start           date
metric_name            text  -- 'gmv_per_month', 'avg_rating', etc.
p25                    numeric
p50                    numeric
p75                    numeric
p90                    numeric
top_decile             numeric
sample_size            int
PRIMARY KEY (category, city, period_start, metric_name)
```

---

## API endpoints — REST contract

OpenAPI spec lives in `03-Engineering/api.yaml` (to be generated from this section). Verbs follow REST conventions; auth via `Authorization: Bearer <jwt>` unless marked public.

### Auth

```
POST   /auth/email-magic-link        public · {email}
POST   /auth/verify                  public · {token} → {jwt, user}
POST   /auth/oauth/{provider}        public · provider in [google, apple]
POST   /auth/refresh                 {refresh_token} → {jwt}
DELETE /auth/session                 logout
```

### Me

```
GET    /me                           full user profile
PATCH  /me                           update display_name, bio, avatar, language
GET    /me/bookings                  upcoming + past
GET    /me/circles                   active circles
GET    /me/notifications             paginated
PATCH  /me/notifications/{id}/read   mark read
```

### Events

```
GET    /events                       public · query: ?category=&neighbourhood=&date_from=&date_to=
GET    /events/{id}                  public · returns event + host summary
POST   /events                       host creates · multipart for photos
PATCH  /events/{id}                  host edits
DELETE /events/{id}                  soft-delete (host or admin)
POST   /events/{id}/book             {seat_count, deposit_only?} → Stripe PI client_secret
POST   /events/{id}/checkin          QR scan, host-side
```

### Circles

```
GET    /circles/{id}                 members + recent messages (auth: must be member)
POST   /circles/{id}/messages        {body, attachments?}
GET    /circles/{id}/messages        paginated, oldest first
POST   /circles/{id}/keep            afterlife vote
GET    /circles/{id}/capsule         → memory capsule object
```

### Arriving feature

```
POST   /events/{id}/arriving         {state: 'before'|'after', photo: file} multipart
GET    /events/{id}/arriving         all moments visible to the requesting user (Circle-scoped)
DELETE /arriving/{id}                user can delete own moment
```

### ~~Go together~~ — REMOVED in Pass 40

Endpoints removed when Alina cut Go-together CTA. **Do not implement.**

### Payments

```
POST   /payments/intents             create Stripe PI for booking
POST   /webhooks/stripe              Stripe webhook receiver
POST   /payouts/onboarding           create Express account, return Stripe URL
GET    /payouts/{host_id}/balance    available + pending
```

### Search

```
GET    /search                       public · ?q=&date_from=&date_to=&category=
```

### Programs + Certificates (Sprint 45)

```
POST   /me/programs                                 host · submit a Program for verification (Premium only)
GET    /me/programs                                 host · list own Programs by status
GET    /programs/{id}                               host · own program detail
PATCH  /programs/{id}                               host · edit (only while status=draft|rejected)

POST   /admin/programs/{id}/verify                  internal Trust team · approve
POST   /admin/programs/{id}/reject                  internal · reject with reason
POST   /admin/programs/{id}/under-review            internal · pause issuance

POST   /events/{id}/issue-certificates              host · batch issue post-event
GET    /me/certificates                             attendee · list earned
GET    /v/{public_slug}                             public · verification page (read-only)
DELETE /certificates/{id}                           host or recipient · revoke (with reason)
```

### Creator Business view (Sprint 46 / 47)

```
GET    /me/business                                 Pro+ · sections 1-4 (numbers, tier check, founding bar, recommendations)
GET    /me/business/peer-benchmarks                 Premium only · section 5
GET    /me/business/projection                      Premium only · section 6 (only after 6mo of history)
GET    /me/business/recommendations                 computed recommendations engine output
POST   /me/business/recommendations/{id}/plan       "Plan this →" action — opens partly-prefilled Create flow
GET    /me/quarterly-pdf/latest                     Premium only · signed URL of latest "Your Quarter" PDF
```

---

## Frontend ↔ Backend mapping

What the prototype mocks vs. what needs real backend.

| Prototype behavior | Real backend |
|--------------------|--------------|
| `go(screen)` route changes | Frontend router (React Navigation in RN, App Router in Next) |
| `toast(msg)` notifications | Frontend toast lib, no backend |
| `setCatTab(scr, tab)` toggle | Frontend state — no backend |
| `togIntent` (mood tile toggle on onboarding) | Frontend state only — stored as part of user preferences if useful for event personalisation |
| `voteKeep(true|false)` afterlife vote | `POST /circles/{id}/keep` |
| `toggleVibeList()` UI-only expand | Frontend state |
| `openShareSheet({...})` | Native share API (RN share, Web Share API) |
| `openPeopleProfile(card)` | `GET /users/{id}/profile` |
| Hardcoded photo URLs (Unsplash) | Cloudflare R2 signed URLs |
| Hardcoded mock data (María, David, Sofía) | `GET /events`, `GET /events/{id}/people` |
| Arriving prompt cards | Triggered by scheduled jobs at T-6h and T+30min |
| Memory Capsule auto-renders | Backend cron generates Capsule 12h after event end |
| Address-unlock countdown | Backend reveals `events.address` at T-1 day |
| Circle 48h afterlife window | Background job evaluates afterlife at T+7 days |

---

## MVP build slice

Build this first. Five surfaces, end-to-end. Everything else can wait.

**1. Auth.** Email magic link + OAuth (Google, Apple). JWT session.

**2. Browse + book.** `GET /events` with filters, `GET /events/{id}` detail, `POST /events/{id}/book` with Stripe PI flow. Confirmation email + push notification.

**3. Circle chat.** WebSocket-backed, the existing Pottery Sunday flow. Address unlock at T-1 day. No advanced features (no reactions, no threads, no GIFs).

**4. Arriving feature backend.** Cron at T-6h (push notif), T+30min (push notif), photo upload + storage in R2, 48h chat-expiry purge job, Capsule "the difference" auto-generation 12h after end_at.

**5. Profile + identity declarations.** `GET /me`, `PATCH /me`, `PUT /me/intents`. Profile shows the chips read-only on others' profiles, editable on own.

That's the MVP slice. ~6 weeks for a competent solo backend engineer including Stripe Connect onboarding, basic moderation tooling, and k6 load testing. ~10 weeks if Romain takes it solo + does iOS native push setup.

Everything in the Future Frames Plan beyond this MVP slice is post-launch.

---

## Privacy / GDPR considerations

- **Arriving photos** auto-purge from chat at T+48h. Permanent in Capsule. User can delete their own photos via `DELETE /arriving/{id}`.
- **Right to erasure (Article 17)** — soft-delete users, hard-delete on confirmed request after 30 days.
- **Data export (Article 20)** — `GET /me/export` returns ZIP of all user data (events, photos, messages).
- **Identity chips visibility** — declared chips visible on public profile by default (intentional discoverability). User can hide individual chips if needed.
- **Address unlock** — never expose `events.address` until T-1 day, even via API. Enforce at query layer.
- **Photo signed URLs** — never expose direct R2 URLs. All access via signed URLs with 60-min expiry.

---

## Scheduled jobs

| Job | Cron | Action |
|-----|------|--------|
| Arriving pre-prompt | every 5 min | Find events with `starts_at` between now+5h55m and now+6h05m, push to all booked attendees |
| Arriving post-prompt | every 5 min | Find events with `ends_at` between now+25m and now+35m, push |
| Address unlock | every hour | Find events with `starts_at` between now+23h and now+24h, set `address_locked = false` and push |
| Circle 48h chat expiry | hourly | Soft-delete chat messages with `created_at + 48h < now` AND event is past |
| Memory Capsule generation | hourly | For events with `ends_at + 12h < now` AND no Capsule yet, generate |
| Afterlife vote evaluation | daily | For Circles at T+7 days, check vote tally, set `kept_at` if threshold met |
| Welcome-back lapsed-user | daily | Push to users with `last_seen_at < now - 30d` |

Use BullMQ on Redis for job queueing. Keep handlers idempotent.

---

## Localization

Three languages at MVP: Catalan (ca), Spanish (es), English (en).

- Translation source: `01-Product/Catalan_Vocabulary_Lock.md` — every locked phrase has CA / ES / EN columns.
- Storage: i18next-style JSON files at `frontend/src/locales/{ca,es,en}/*.json`.
- Server-side: detect language from `Accept-Language` header, override with `users.language`.
- Default for Barcelona: CA. Outside Catalonia: device locale → ES → EN fallback.

Do not paraphrase locked phrases. Adding new copy = add a row to `Catalan_Vocabulary_Lock.md` first, get Alina to sign off, then translate.

RTL not in MVP scope. Plan for it in v2 if expanding to Arabic markets.

---

## Testing strategy

Per the `incircleme-testing` skill memory.

- **Unit:** Vitest. Coverage target 80% for business logic (booking, payouts, scheduled jobs).
- **Integration:** Hit a real test database (Postgres in Docker), real test Redis. Mock external services (Stripe, push providers) at the boundary.
- **E2E:** Playwright for web, Detox for RN. The five MVP surfaces have happy-path E2E coverage at minimum.
- **Accessibility:** Lighthouse CI in pipeline with WCAG 2.1 AA assertions. No regressions allowed.
- **Performance:** Lighthouse for web (LCP < 2.5s, CLS < 0.1). k6 load test on `GET /events` and `POST /events/{id}/book` (target 500 RPS at p95 < 200ms).
- **Security:** OWASP ZAP scan in CI. Snyk on dependencies. Stripe webhook signature verification mandatory.

---

## Open engineering questions

These need a call before MVP build kicks off.

1. **REST vs GraphQL** — REST is simpler for this scope. Push for REST unless team has GraphQL experience.
2. **Monorepo or split?** — A monorepo (frontend, backend, infra) with pnpm workspaces is the modern default. Split if Romain prefers.
3. **Where does moderation live?** — Auto-mute or human review? MVP suggestion: human-review queue at `POST /reports`, with a tiny admin panel.
4. **iOS first or Android first?** — Barcelona has slightly higher iOS share. Suggest iOS first beta, Android in week 2.
5. **Search infrastructure** — Postgres full-text is fine for MVP. Move to Meilisearch / Typesense at 10K+ events.
6. **Stripe Connect Express vs. Custom?** — Express is much faster to ship. Custom only if we need hidden white-label checkout.

---

## How to start

If you are Romain:

1. Clone the repo (Alina has the GitHub URL — currently no push from this prototype branch).
2. Run the prototype locally: `open IncircleMe-v3/index.html` in Chrome.
3. Click through every screen. Read the inline comments — they document why decisions were made.
4. Read this handoff in full.
5. Ask Alina to walk you through the prototype on a video call. The voice and the editorial choices are what matters most. Functions are easy; voice is the moat.
6. Set up the Postgres + Redis + R2 stack. Use the Tech stack table above as the recommendation, but make your own call.
7. Build the MVP slice in the order above. Auth → Browse + Book → Circle → Arriving → Profile.
8. Land in Barcelona for two weeks of closed beta with the first 50 hosts (per `project_strategy_framework` — "win one barrio").

If you are Claude Code (autonomous agent):

1. Read this doc end-to-end. Read the prototype HTML. Read the Catalan vocabulary lock.
2. Open a new branch in the IncircleMe repo: `feat/mvp-backend-from-prototype`.
3. Scaffold the stack: package.json, pnpm workspace, Fastify (or NestJS) app, Drizzle / Prisma migrations, BullMQ workers.
4. Build the data model from the schema above. Generate migrations.
5. Build the API endpoints in the order of the MVP slice (auth first).
6. Wire WebSocket for the Circle chat.
7. Implement scheduled jobs.
8. Write unit + integration tests as you go (TDD where it makes sense, post-hoc otherwise).
9. **Do not push to GitHub without Alina's explicit approval** (project rule, applies to both human and AI agents).
10. Open a PR with a careful description and ask Alina + Erik to review.

---

## Reference index

- Prototype: `IncircleMe-v3/index.html`
- Deploy mirror: `_deploy/index.html` (byte-identical, awaiting upload)
- Vocab lock: `01-Product/Catalan_Vocabulary_Lock.md`
- Future plan: `01-Product/Future-Frames-Plan-2026-04-27.md`
- Sprint 43 plan: `01-Product/Sprint-43-Plan-2026-04-27.md`
- Sprint 43 decisions: `01-Product/Sprint-43-Decisions-2026-04-25.md`
- Pricing model: in `project_pricing_model` memory · Basic free 5% · Pro €20 3% · Premium €60 0%
- Strategy framework: in `project_strategy_framework` memory · 9 principles
- Brand & UI tokens: cream `#F7F3ED` · coral `#D4825A` · forest `#2E4531` · gold `#E5B73D` · Fraunces (display) + Inter (body)

---

*Handoff written 2026-04-27 with the prototype at md5 `5df55f55…` after Pass 35 shipped. The prototype is the source of truth. This document is the bridge.*
