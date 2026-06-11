# IncircleMe — Codex Brief

**Date:** 2026-06-10
**For:** OpenAI Codex (autonomous build) · Romain (lead engineer)
**From:** Alina (founder · product owner)
**Prototype state:** `IncircleMe-v3/index.html` · md5 `d5f3f3b4…` · 621,603 B · Pass 40 (Great Simplification) shipped · 0 dead routes · deploy mirror byte-identical

Read this first. Then the prototype. Then the long Engineering Handoff. Everything else is reference.

---

## What we are building

A hyperlocal **events and programs** marketplace for Barcelona. Two things only:

- **Single events** — yoga classes, pottery sessions, wine walks, life-drawing, sound baths. 4–12 attendees per room. Hosts can be hobbyist (Basic), working (Pro) or professional (Premium / Studio).
- **Verified Programs** — multi-week courses with certificates (Hands in Clay, Drawing from Life, Catalan for Newcomers, etc.). Premium hosts only. Programs go through a four-gate trust review before they can issue certificates. Certificates are publicly verifiable at `incircleme.com/v/{cert_id}`.

That is the whole product. There is **no people-search**, no friend-graph, no people grid, no "find people to join events with" surface. Profiles exist (host bio, host reputation, attendee identity) but they are reached **through events** — never via search or discovery. This was simplified by Alina on 2026-06-10 (Pass 40) — the prototype reflects the simplified scope.

---

## The MVP slice — build this first

Six surfaces, end-to-end, for one barri (Gràcia). Everything else can wait.

1. **Auth** — email magic link + Google + Apple OAuth. JWT session.
2. **Browse + book single events** — Home (Tonight rotating card → Categories → Programs strip), Category screen, Event detail, Booking with Stripe Payment Intent. Confirmation push + email.
3. **Circle chat** — WebSocket. One Circle per event. Address unlocks at T–1 day. The Arriving prompt fires at T–6h and T+30min (scheduled jobs). 48h chat-side photo expiry.
4. **Memory Capsule** — auto-generated 12h after `event.ends_at`. Includes the side-by-side "the difference" view for any attendee who shared both their arriving and leaving photo.
5. **Programs + certificates** — Program detail screen (curriculum, weeks, certificate explainer, cohort, Voices, public Q&A, sticky Enrol CTA). Premium-host Program submission flow. IncircleMe Trust review queue (internal admin). Public verification page at `/v/{cert_id}`.
6. **Profile + Reputation Passport + Creator Dashboard with Business view** — minimal profile (name, bio, neighbourhood, languages, Attended/Hosted/Bookings stats, Reputation Passport). Premium creators see the six-section Business tab.

That is the whole MVP. ~10–12 weeks for a competent solo backend engineer.

---

## Tech stack — go boring

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo | One codebase, iOS-first beta |
| Web | Next.js 14 | SSR, public verification page lives here |
| Backend | Node.js + Fastify | Single language across stack |
| Database | PostgreSQL 16 | JSONB for flexible fields |
| Cache + queues | Redis + BullMQ | Scheduled jobs (T–6h, T+30min, Capsule generation) |
| Storage | Cloudflare R2 | Photos with signed URLs |
| Auth | Lucia + JWT | Magic link + OAuth |
| Payments | Stripe Connect Express | Creator payouts, EU KYC |
| Real-time | Socket.io | Circle chat |
| Push | Expo Push (native) + Web Push | Arriving prompts |
| Hosting | Fly.io + Cloudflare | Madrid + Frankfurt edge for low-latency Spain |
| Monitoring | Sentry + Grafana Cloud + PostHog | Errors, perf, product |
| Infra | Terraform + GitHub Actions | Boring, audited |

If Codex (or Romain) prefers Go / Python on the backend, fine — contracts in the long Engineering Handoff are language-agnostic.

---

## Data model — minimum tables for MVP

Soft-delete everywhere. Timestamps `timestamptz`. UUIDv7 IDs. Source of truth: `03-Engineering/Engineering-Handoff-2026-04-27.md`.

Required for MVP:

- `users` (id, email, display_name, handle, avatar_url, bio, neighbourhood, language, joined_at, last_seen_at, trust_tier, trust_score)
- `events` (id, host_user_id, title, description, category, neighbourhood, address, address_locked, starts_at, ends_at, seat_count, seats_booked, price_cents, photo_urls, arriving_enabled, deposit_required)
- `circles` (id, event_id, opens_at, closes_at, kept_at, member_count)
- `circle_members` (circle_id, user_id, role, joined_at)
- `circle_messages` (id, circle_id, user_id, body, attachments JSONB, created_at)
- `arriving_moments` (id, event_id, user_id, state 'before'|'after', photo_url, chat_expires_at, taken_at)
- `bookings` (id, event_id, user_id, status, seat_count, amount_cents, stripe_pi_id, booked_at, checked_in_at)
- `reviews` (id, event_id, reviewer_id, host_id, rating, body, created_at)
- `programs` (id, host_user_id, title, curriculum JSONB, time_frame_total_hours, accreditation_body, status, verified_at, submission_fee_cents)
- `program_credentials` (id, program_id, file_url, file_kind, verified_at)
- `certificates` (id, program_id, event_id, host_user_id, recipient_user_id, kind, grade, verification_tier, public_slug, pdf_url, issued_at)
- `notifications` (id, user_id, type, payload JSONB, read_at, sent_at)
- `creator_payouts` (id, host_user_id, stripe_account_id, event_id, gross_cents, platform_fee_cents, net_cents, payout_at, state)
- `business_review_snapshots` (creator_id, period_start, period_end, events_count, attendees_count, gmv_cents, kept_circles_count, avg_rating, repeat_attendees_count, fill_rate)

**Explicitly NOT needed** (these tables were in the older spec, removed in Pass 40):

- ~~`user_intents`~~ — identity declarations gone
- ~~`kept_close`~~ — Keep-close relationship gone
- ~~`go_together_requests`~~ — Go-together CTA gone
- ~~`direct_messages`~~ thread + permanent-unlock metadata — 1:1 DMs are gated by shared-event attendance only, no Go-together unlock
- ~~`category_benchmarks`~~ — Sprint 46/47 (Premium Business view) only; not MVP

---

## API endpoints — MVP slice

```
POST   /auth/email-magic-link        public
POST   /auth/verify                  public → {jwt, user}
POST   /auth/oauth/{provider}        public · google | apple

GET    /me                           full profile
PATCH  /me                           update display_name, bio, avatar, language

GET    /events                       public · ?category=&neighbourhood=&date_from=&date_to=
GET    /events/{id}                  public · event + host summary
POST   /events                       host creates · multipart for photos
POST   /events/{id}/book             {seat_count, deposit_only?} → Stripe PI client_secret
POST   /events/{id}/checkin          QR scan, host-side

GET    /circles/{id}                 members + recent messages (auth: must be member)
POST   /circles/{id}/messages        {body, attachments?}
GET    /circles/{id}/messages        paginated
GET    /circles/{id}/capsule         → memory capsule object

POST   /events/{id}/arriving         {state: 'before'|'after', photo: file} multipart
GET    /events/{id}/arriving         all moments visible to requester (Circle-scoped)
DELETE /arriving/{id}                user can delete own moment

GET    /programs                     public · listing
GET    /programs/{id}                public · detail + curriculum + cohort
POST   /me/programs                  host · submit Program (Premium only)
GET    /me/programs                  host · list own Programs by status
POST   /events/{id}/issue-certificates    host · batch issue post-event
GET    /me/certificates              attendee · list earned
GET    /v/{public_slug}              public · verification page (read-only)

POST   /payments/intents             create Stripe PI for booking
POST   /webhooks/stripe              Stripe webhook receiver
POST   /payouts/onboarding           Stripe Express account onboarding
```

---

## Pricing (canonical v2)

| Tier | Monthly | Transaction fee | Events / month |
|---|---|---|---|
| Basic | Free | 5% | 2 |
| Pro | **€35** | **2%** | 8 |
| Premium | **€80** | **0%** | Unlimited |
| Drop-in | — | 5% + €15 listing | 1 / event |

- Verified Program submission: **€150 one-time** per Program (refundable on rejection)
- Premium subscribers get 1 free Program included
- Founding hosts (first 50): free Premium for life + 1 free Program per year contingent on 300 attendees + 6 Kept Circles + 4.5 rating in the prior 12 months
- Boost: €25 each. Pro gets 1 free/month. Premium gets 2 free/month.

Full pricing logic, edge cases, and Year 1 revenue projection in `04-Marketing/IncircleMe_Tier_Plan_2026-04-27.docx` and memory `project_pricing_model`.

---

## Editorial voice — non-negotiable

The vocabulary is the moat. Locked phrases in `01-Product/Catalan_Vocabulary_Lock.md`. Codex must not paraphrase. The most-locked phrases:

- *"Small rooms"* — never "events" in marketing copy
- *"Walking in"* — never "attending"
- *"the difference"* — the Arriving feature signature
- *"Room full"* — never "Sold out"
- *"Programs. Where craft becomes your way."* — Home Programs eyebrow, verbatim
- *"Verified by IncircleMe Trust · the certificate is real."* — under Programs strip
- *"A real credential — not a participation sticker."* — Program detail

Three languages supported at MVP: Catalan (default in Barcelona), Spanish, English. Translation source is the vocab lock. Adding new copy = add a row to the lock first, get Alina to sign off, then translate.

---

## Scheduled jobs (BullMQ on Redis)

| Job | Cadence | What |
|---|---|---|
| Arriving pre-prompt | every 5 min | events with `starts_at` between now+5h55m and now+6h05m → push to all booked attendees |
| Arriving post-prompt | every 5 min | events with `ends_at` between now+25m and now+35m → push |
| Address unlock | hourly | events with `starts_at` between now+23h and now+24h → set `address_locked=false` + push |
| Circle 48h chat expiry | hourly | soft-delete chat photos with `created_at + 48h < now` AND event is past |
| Memory Capsule generation | hourly | for events with `ends_at + 12h < now` AND no Capsule yet, generate |
| Afterlife vote evaluation | daily | for Circles at T+7 days, check vote tally, set `kept_at` if threshold met |
| Welcome-back lapsed-user | daily | push to users with `last_seen_at < now - 30d` |

All handlers must be idempotent.

---

## What's in the prototype already

Every screen the MVP needs is mocked in `IncircleMe-v3/index.html` (open in Chrome). Click through:

- **Onboarding** — welcome (CA-first), intent, interests, neighbourhood, notifications, signup
- **Home** — greeting, search, Tonight rotating ad, Types of events, Programs strip
- **Category screens** (Art, Learning) — events list with Ad-slot at top
- **Event detail** — hero, host row, description, attendees, Book button
- **Circle chat** — address-unlock countdown, Arriving prompt, message bubbles, afterlife vote
- **Memory Capsule** — hero, "the difference" two-pane, photo roll, attendees, Highlights, share
- **Program detail (Hands in Clay)** — hero, intro, host row, 6 week cards, certificate explainer, cohort, Voices, public Q&A, Quiet questions FAQ, Enrol CTA
- **Bookings + Tickets** — booking confirmation, QR check-in
- **Profile** — minimal: hero, About, Creator mode tile, 3 stats (Attended / Hosted / Bookings), Reputation Passport
- **Creator Dashboard** — events list, attendees, payouts, Stripe Connect, Business view (Premium) with 6 sections + quarterly PDF affordance
- **Settings** — notifications, privacy, language

The prototype is the source of truth for visual + interaction patterns. Translate them into data model + API contracts, not the other way around.

---

## How to start

If you are Codex (autonomous agent):

1. Read this brief end-to-end.
2. Read `IncircleMe-v3/index.html` — open it locally, click every screen, note every component. The inline HTML comments document why each decision was made.
3. Read `01-Product/Catalan_Vocabulary_Lock.md` — the locked copy.
4. Read `03-Engineering/Engineering-Handoff-2026-04-27.md` for the deep reference. **Note:** that doc was written before Pass 40. Wherever it mentions user_intents / kept_close / go_together_requests / direct_messages permanent-unlock / category_benchmarks — those are out. This brief supersedes.
5. Scaffold a monorepo: `pnpm-workspace.yaml`, `apps/web` (Next.js), `apps/mobile` (Expo), `apps/api` (Fastify), `apps/admin` (internal trust review UI), `packages/db` (Drizzle migrations), `packages/types` (shared TypeScript types).
6. Build the data model — generate migrations from the table list above.
7. Build the API endpoints in MVP-slice order: Auth → Browse + Book → Circle + Arriving → Profile → Programs.
8. Implement scheduled jobs.
9. Write unit + integration tests as you go. Hit a real Postgres in Docker.
10. **Do not push to GitHub without Alina's explicit approval.** Open a PR with a careful description and ask Alina to review.

If you are Romain (human):

Same as above, plus: ask Alina to walk you through the prototype on a video call before you write a line of code. The voice and the editorial choices are what matters most. Functions are easy; voice is the moat.

---

## Reference index

- This brief: `Codex-Brief-2026-06-10.md` (you are here, at the workspace root)
- Prototype (source of truth): `IncircleMe-v3/index.html`
- Deploy mirror: `_deploy/index.html` (byte-identical, awaiting Alina's GitHub push approval)
- Long Engineering Handoff: `03-Engineering/Engineering-Handoff-2026-04-27.md`
- Vocabulary lock: `01-Product/Catalan_Vocabulary_Lock.md`
- Future frames plan: `01-Product/Future-Frames-Plan-2026-04-27.md`
- Pricing canonical (v2): `04-Marketing/IncircleMe_Tier_Plan_2026-04-27.docx`
- Founding Host Charter: `04-Marketing/Founding-Host-Charter-2026-04-27.md`
- Creator Business view spec: `01-Product/Creator-Business-View-Spec-2026-04-27.md`
- Investor Overview: `01-Product/Investor-Overview-2026-04-27.docx` + `.html` (note: as of Pass 40 these reflect pre-Pass-40 scope; Alina will refresh when she has time)

---

*Brief written 2026-06-10 after Pass 40 (Great Simplification). The prototype is the source of truth. This brief is the bridge. Build cleanly.*
