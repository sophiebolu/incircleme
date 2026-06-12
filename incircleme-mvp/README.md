# IncircleMe MVP

Monorepo for the IncircleMe MVP — hyperlocal **events + programs** marketplace for Barcelona.
Scope is Pass 40 (Events + Programs only). Source of truth: `../IncircleMe-v3/index.html` +
`../Codex-Brief-2026-06-10.md`. Voice/copy is locked in `../01-Product/Catalan_Vocabulary_Lock.md`.

## Layout

```
apps/
  api      Fastify + Postgres (Drizzle) backend
  web      Next.js 15 (App Router) — public site + /v/{slug} certificate verification
  mobile   Expo (iOS-first) — the app, brand-faithful (cream/coral/Fraunces)
packages/
  db       Drizzle schema + migrations
  types    Shared TypeScript domain types
  i18n     Locked CA/ES/EN strings (sourced ONLY from the Vocabulary Lock)
```

## Prerequisites

- Node 20+ (developed on 26), pnpm 11
- Postgres 16 + Redis 7 (brew services or docker)

## Setup

```bash
pnpm install
createdb incircleme_dev            # once
pnpm db:generate                   # generate SQL from schema
pnpm db:migrate                    # apply migrations
```

## Run

```bash
pnpm dev:api      # http://localhost:4000/health
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo
```

Build order: Auth → Browse + Book → Circle → Capsule → Programs → Profile.
Never push to GitHub without explicit approval. New user-visible copy must be added to the
Vocabulary Lock and signed off before shipping.
