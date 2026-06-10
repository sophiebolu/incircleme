# How to Work with Codex — a Practical Guide for Alina

**Date:** 2026-06-10
**For:** Alina (Founder · non-developer)
**Purpose:** Use OpenAI Codex to build the IncircleMe app from the prototype, without needing to write code yourself.

This is the everyday handbook. Open it before you start a session. Keep it next to your coffee.

---

## What Codex actually is

Codex is an AI agent from OpenAI that writes code, runs commands, and edits files for you. You talk to it in plain English. It reads files. It writes files. It runs tests. It tells you what it did.

You stay the founder. You make the decisions. Codex does the typing.

There are two ways to use it:

1. **Codex CLI** (`codex`) — runs on your Mac in Terminal. Good for working on the IncircleMe codebase locally.
2. **Codex in ChatGPT** (the "Codex" panel inside ChatGPT) — runs in OpenAI's cloud. Good for quick experiments and asking questions without setting up locally.

You'll mostly want the **CLI** for IncircleMe because that's how Codex can read your prototype HTML and the workspace docs directly. Setup takes 10 minutes.

---

## Setup once — 10 minutes

### 1. Install the Codex CLI

Open **Terminal** on your Mac (Spotlight → "Terminal"). Paste this line and press enter:

```
npm install -g @openai/codex
```

If that says "command not found: npm" you need Node.js first. Install it from <https://nodejs.org> (the LTS version, big green button) and try again.

### 2. Log in

Run this and follow the prompts:

```
codex login
```

It will open a browser, ask you to sign in to OpenAI, and then come back to Terminal automatically.

### 3. Open Codex in your IncircleMe folder

Run these two lines, one at a time:

```
cd ~/Library/CloudStorage/OneDrive-Personal/IncircleMe2/IncircleMe2
codex
```

That puts you inside the workspace. Codex now sees every file we've made — the prototype, the brief, the vocabulary lock, all of it.

That's setup done. From now on, every session is just `cd` into the folder and `codex`.

---

## Your first session — start the backend build

The Codex-Brief at the workspace root tells Codex what to build. Your first prompt is just pointing it at the brief and asking it to start.

Paste this verbatim into Codex when it opens:

> Read `Codex-Brief-2026-06-10.md` end-to-end. Then read `IncircleMe-v3/index.html` and `01-Product/Catalan_Vocabulary_Lock.md`. Once you've read all three, tell me back in your own words what we're building, and ask me any clarifying questions before you write a line of code. Do not start building yet.

That's the prompt. Codex will read everything and reply with its understanding. You read what it says. If it got something wrong, correct it in plain English. If it got everything right, say:

> Great. Now scaffold the monorepo as described in the Codex-Brief: `pnpm-workspace.yaml` at the root, four apps (`apps/web`, `apps/mobile`, `apps/api`, `apps/admin`), and two packages (`packages/db`, `packages/types`). Don't write features yet — just the empty scaffolding with `package.json` files and the right folder layout. Show me the file tree when you're done.

Codex will create the folders and files. It will show you what it did.

After that, the build is a conversation. You go one step at a time. You never ask Codex to "build the whole app" — you ask it to build one piece, review, then ask for the next piece.

---

## The pattern that works — small steps, always

The trap with AI agents is asking for too much at once. Codex can do a lot, but the more it does in one go, the more chances something is slightly wrong. Slightly wrong is hard to spot and harder to fix.

Use this pattern:

1. **Pick one slice.** "Build the auth flow." Or "build the events list page." Or "build the booking confirmation screen." Not "build the backend."
2. **Ask Codex to plan first.** "Before you code: list the files you'll create or change, and tell me what each one does."
3. **Read the plan.** If it sounds right, say "go." If not, correct in plain English ("don't use Supabase, we're using our own Postgres" / "the colour should be coral, not orange" / "use the locked vocabulary for that button label").
4. **Codex builds.** Run what it suggests, or accept its changes. It will tell you the commands to run.
5. **You sanity-check.** Open the file in the editor (Visual Studio Code is free at <https://code.visualstudio.com>). Look at it. Does the copy match the vocab lock? Does the layout match the prototype? You don't need to read every line of code — you check the visible bits and the names of things.
6. **Move to the next slice.**

If you're ever stuck, ask Codex: "explain this file to me in three sentences" or "show me how this maps to the prototype." It will translate code back into normal language.

---

## The MVP slice in order

The Codex-Brief lists six MVP surfaces. Build them in this order. Each one is a separate Codex session. Each takes between half a day and three days of working with Codex.

1. **Auth.** Email magic link plus Google/Apple OAuth. JWT session. You're looking for: a login screen, a signup screen, a session that survives reload.
2. **Browse + Book events.** Home page (Tonight / Categories / Programs strip), Category pages, Event detail, Booking with Stripe Payment Intent. You're looking for: paste a card number, see a booking confirmation.
3. **Circle chat.** WebSocket-backed chat for the booked event. You're looking for: open a chat, type a message, see it land.
4. **Arriving feature.** Scheduled push at T-6h and T+30min, photo upload, 48h chat expiry, Memory Capsule "the difference" view. You're looking for: photos appear in the Capsule the next morning.
5. **Programs + Certificates.** Program detail page, Program submission flow (Premium hosts only), Trust review queue, public verification page at `/v/{cert_id}`. You're looking for: enrol in a Program, see the certificate on the verification page after completion.
6. **Profile + Reputation Passport + Creator Business view.** Simple profile. Premium creators see the six-section Business tab. You're looking for: numbers update as bookings come in.

After the sixth one, the MVP is shippable.

---

## When to bring Romain in

Codex is good. Romain is irreplaceable. Bring him in for:

- **Architecture decisions.** Codex defaults to good choices, but if something feels weird ("why are we using three databases?"), ask Romain.
- **Stripe Connect onboarding.** Live payments need a human eye. Romain reviews the Stripe webhook handler before any real money flows.
- **Security review before the first push to GitHub.** Codex writes safe code most of the time, but "most of the time" isn't good enough for payments and identity. Romain reads the auth flow, the payment flow, and the data model.
- **Deployment to production.** First deploy is Romain. After that, Codex can handle deploys with your approval.
- **Anything where Codex says "I'm not sure" or "this could go either way."** Don't pick the coin flip. Ask Romain.

A good rhythm: you and Codex build a slice. Romain reviews the slice before the next one starts. Iterate.

---

## GitHub — what you actually need to know

GitHub is where the code lives. It's like Google Drive for code.

**Rules:**

1. **Never push to GitHub without explicit approval.** This is a workspace rule from day one — applies to Codex too. When Codex asks "ready to push?", you read the changes first.
2. **One branch per slice.** Codex creates a branch like `feat/auth-magic-link`. You merge after Romain reviews.
3. **Pull Requests** are how changes get reviewed. Codex opens a PR. Romain (or you, after a few weeks of getting used to it) comments and approves.

The Codex CLI handles the git commands. You don't need to memorise them. The pattern you'll repeat is:

- Codex: "I'm ready to push this slice."
- You: "Show me the changes first."
- Codex: shows you a diff (added lines in green, removed in red).
- You: skim it. Ask Codex any questions ("what does this file do?"). Look for surprises.
- You: "Open a PR and ask Romain to review."
- Codex: opens the PR. Sends Romain a link.

---

## Daily / weekly rhythm

**Each morning** (or whenever you start):

```
cd ~/Library/CloudStorage/OneDrive-Personal/IncircleMe2/IncircleMe2
codex
```

Tell Codex what you want to do today. *"Today we're building the Booking flow. Start by reading the Event detail screen in the prototype, then plan the backend POST /events/{id}/book endpoint."*

**During the session:**

- Take small steps.
- Read what Codex shows you.
- Correct in plain English when it drifts.
- Commit at the end of each slice (Codex will offer to).

**End of week:**

- Open `Dashboard.html` in Chrome — see what's shipped.
- Ask Codex: "Summarise what we built this week." Use the summary in your next investor update.
- Push to GitHub (with approval) so Romain can review over the weekend.

---

## How to talk to Codex — examples

These are the kinds of prompts that work well. Copy-paste, adapt.

**Starting a session:**

> Today's goal: build the Event detail screen using the prototype's `data-screen="event"` HTML as the design source. Use Next.js for the web version. Read the prototype first, then list the components you'd extract, then ask me which ones we should build now.

**When something looks wrong:**

> That button colour is too red. The prototype uses `#D4825A` (coral). Update the design tokens to match.

**When the editorial voice slips:**

> The copy you wrote says "Sold out." That's banned vocabulary. The locked phrase is "Room full." Read `01-Product/Catalan_Vocabulary_Lock.md` and replace every instance.

**When you don't understand:**

> Explain this Stripe webhook handler to me in three sentences. Pretend I've never coded. What does it do, what does it protect against, and what could go wrong?

**Ending a session:**

> Summarise what we built today. List the files you changed. Open a PR with a clear description and a link to the Codex-Brief.

---

## What to do when something breaks

It will. Welcome to building software.

**The website won't load.**

Ask Codex: "The website won't load. What's the error?" Codex will check the logs. It will tell you the cause in plain English. It will offer a fix. Accept the fix.

**The booking flow takes the money but doesn't create a booking.**

This is the kind of thing you want Romain on. Tell Codex to leave the broken slice in a branch (do not push) and tag Romain. He can fix the same day.

**Codex confidently writes something wrong.**

It happens. You'll catch most of these because you know the brand voice and the prototype. When it happens:

1. Tell Codex what's wrong in plain English.
2. Tell it to revert the change.
3. Ask it to read the relevant prototype screen or vocab lock entry, and try again.

Codex won't get upset. It does what you say. That's the whole superpower.

---

## What you do NOT need to learn

You don't need to learn:

- TypeScript / JavaScript syntax
- Postgres SQL
- React component lifecycles
- Webpack / Vite / build tooling
- Stripe API specifics
- Docker
- WebSocket protocols

Codex handles all of that. You read its summaries, look at the rendered output, and check that it matches the prototype and the voice.

What you **should** learn over time:

- How to read a Pull Request diff at a glance (5 minutes per PR, max)
- How to open a file in VS Code to look at it
- The names of the screens (you already know these)
- The names of the vocab-locked phrases (you wrote most of them)

---

## A short list of safe commands

These are commands you can run in Terminal at any time without breaking anything. Memorise the bold ones.

- **`cd ~/Library/CloudStorage/OneDrive-Personal/IncircleMe2/IncircleMe2`** — go to the workspace
- **`codex`** — start a Codex session
- **`ls`** — list the files in the current folder
- **`open IncircleMe-v3/index.html`** — open the prototype in your default browser
- **`open Codex-Brief-2026-06-10.md`** — open the brief in your default markdown viewer
- **`open Dashboard.html`** — open the live dashboard
- **`git status`** — see what's changed since the last commit (no danger)
- **`git log --oneline -10`** — see the last 10 commits (no danger)

If you ever see a command in Codex's output you don't recognise and you're nervous, ask: "What does this command do? Is it safe to run?" Codex will explain before you run it.

---

## When to ask Claude (me) for help

You can come back to me whenever:

- The editorial voice needs a decision (new copy that isn't in the vocab lock yet)
- A new feature needs to be designed in the prototype before Codex builds it
- You want a second opinion on what Codex did
- You want to update the Investor Overview, the Tier Plan, or the Founding Host Charter
- You want to brainstorm Sprint 44 / Sprint 45
- You need a memo, deck, doc, or anything in your editorial voice
- Anything that touches Marketing / Brand / Strategy / Hosts / Catalan vocab

For pure engineering — let Codex and Romain handle it. They're the right hands for that work.

---

## One more thing — protect your editorial voice

Codex will sometimes write copy that sounds slightly corporate. That's the danger. "Submit" instead of "Send." "Sold out" instead of "Room full." "Follow this host" instead of "Keep close" — wait, Keep-close is out per Pass 40 — but you get the idea.

When you spot it, fix it immediately. The editorial voice IS the moat. It's worth more than the code. Every time you correct Codex on voice, you're protecting the IncircleMe identity.

The Catalan Vocabulary Lock is your shield. Send Codex back to it any time you see a drift.

---

## Quick reference — three things to keep open

When you're in a build session, keep these three tabs / windows open:

1. **Terminal with Codex running** — your typing surface
2. **VS Code** open to the IncircleMe2 folder — for reading files
3. **Chrome with the prototype** — your visual source of truth

That's the build studio. Coffee on the side.

---

*Written 2026-06-10 after Pass 40 (Great Simplification). Open this guide at the start of every Codex session. If it gets out of date, tell Claude — Claude updates this guide for you.*
