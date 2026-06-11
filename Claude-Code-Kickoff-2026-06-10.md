# Claude Code Kickoff — IncircleMe MVP Build

**Date:** 2026-06-10
**For:** Alina · first session with Claude Code (or Codex — same prompt works)
**How to use:** Open the agent in your IncircleMe workspace folder. Paste the prompt below as your first message. Then point the agent at the documents in the order listed at the bottom.

---

## The prompt — paste this verbatim

```
You are a senior full-stack engineer joining IncircleMe to build the MVP. The product is a hyperlocal events + programs marketplace launching in Barcelona, with three product principles I will not let you violate:

1. Voice is the moat. Every user-visible string must match the locked vocabulary in `01-Product/Catalan_Vocabulary_Lock.md`. When in doubt, ask me — never invent copy. Three languages supported (Catalan-default in Barcelona, Spanish, English).

2. The prototype is the source of truth. `IncircleMe-v3/index.html` (46 screens, single-file HTML) is the design + interaction reference. Translate it into a working backend + React Native + Next.js stack. When the prototype shows a pattern, follow the pattern — even if you'd choose differently from scratch.

3. The scope was simplified on 2026-06-10 (Pass 40). The app is Events + Programs only. There is NO people-search, NO friend graph, NO "find people to join events with" surface. Profiles exist (host bio, attendee identity, Reputation Passport) but reached through events, never via search. If you ever see references in older docs to user_intents, kept_close, go_together_requests, or people endpoints — those are removed. The Codex-Brief at the workspace root is the authoritative simplified scope.

Your job today is to read, not to build. Specifically:

1. Read `Codex-Brief-2026-06-10.md` at the workspace root, end-to-end.
2. Read `IncircleMe-v3/index.html` carefully — open every screen via the picker tab on the left edge, click around, note the patterns. The inline HTML comments document why each decision was made.
3. Read `01-Product/Catalan_Vocabulary_Lock.md` — the locked copy across CA / ES / EN.
4. Skim `03-Engineering/Engineering-Handoff-2026-04-27.md` for the deep data-model and API-contract reference. Note the red banner at the top about Pass 40 cuts — wherever you see ~~strikethrough~~ tables or endpoints, those are explicitly removed from scope.

When you are done reading, before writing any code:

a) Summarise back in your own words what you understand we are building. Three short paragraphs.
b) List the six MVP surfaces from the Codex-Brief in build order, with one sentence each of what the success criterion looks like.
c) Ask me three to five clarifying questions about anything that was ambiguous. Common ambiguities include: payment provider region, push notification certificates, whether Catalan is default everywhere or only in Spain, accreditation body integrations.
d) Wait for my answers before scaffolding anything.

Working method going forward:

- Small steps. We build one slice at a time (auth, then browse-and-book, then circles, then arriving, then programs, then profile/business). Not the whole app at once.
- Plan before code. For every slice, list the files you will create or change, with one sentence each, BEFORE writing any code. I will approve the plan.
- Sanity check after each slice. I review the visible output (copy, layout) against the prototype. You explain anything I ask about in plain English.
- Never push to GitHub without explicit approval. This rule is a workspace constant — applies to you regardless of confidence.
- Bring in Romain (lead engineer) for: architecture decisions, Stripe Connect onboarding, security review before first push, first production deploy. I will tell you when to escalate.
- Three-language vocabulary lock is non-negotiable. Any new user-visible string must either match the lock or be flagged to me for sign-off before shipping.

The first deliverable today is the read-summarise-ask-clarify sequence above. Do not start scaffolding until I say go.
```

---

## Documents to share, in priority order

You can either point the agent at the whole `IncircleMe2` folder (most tools support that), or share files one at a time. Either way, these are the ones that matter, ordered by priority.

### Tier 1 — Primary (share at the start of every session)

1. **`Codex-Brief-2026-06-10.md`** (workspace root) — the simplified scope. Single-page authoritative answer to "what are we building." Names the MVP slice, the tech stack, the data model, the API endpoints, the locked editorial phrases, the scheduled jobs.

2. **`IncircleMe-v3/index.html`** — the 46-screen single-file prototype. The visual + interaction source of truth. Inline comments document every decision. The agent should open this in a browser to click through, not just read as text.

3. **`01-Product/Catalan_Vocabulary_Lock.md`** — the locked copy. CA / ES / EN. Translators reference this directly. The agent must never paraphrase locked phrases.

### Tier 2 — Deep reference (share when the slice needs it)

4. **`03-Engineering/Engineering-Handoff-2026-04-27.md`** — the long-form data model, API contracts, GDPR notes, scheduled jobs, testing strategy. **Note:** has a red banner at the top about Pass 40 cuts. Tables and endpoints marked `~~strikethrough~~ — REMOVED in Pass 40` are not in scope.

5. **`04-Marketing/IncircleMe_Tier_Plan_2026-04-27.docx`** — pricing canonical v2 (Pro €35 / 2%, Premium €80 / 0%, drop-in €15+5%). Needed when the agent builds the subscription flow, the fee calculation, or the Premium-only gates (verified Programs, Business view).

6. **`04-Marketing/Founding-Host-Charter-2026-04-27.md`** — what we promise the first 50 hosts. Needed when the agent builds the founding-host badge surface, the yearly renewal bar logic, or any internal admin tooling for hand-onboarding.

### Tier 3 — Context (share once for orientation, not for every session)

7. **`01-Product/Future-Frames-Plan-2026-04-27.md`** — what's coming after MVP. Useful so the agent doesn't over-engineer for things we'll add later.

8. **`01-Product/Investor-Overview-2026-04-27.docx`** — strategic positioning, market size, retention loops, team. Useful for the agent to understand WHY we're building this way. **Note:** still reflects pre-Pass-40 scope; tell the agent that the Codex-Brief supersedes any people-discovery references in this doc.

9. **`01-Product/Creator-Business-View-Spec-2026-04-27.md`** — the six-section Premium creator dashboard. Needed in Sprint 46/47 (post-MVP), not in MVP.

### Tier 4 — Working reference (you keep, not for the agent)

10. **`How-to-Work-with-Codex-2026-06-10.md`** — your founder-level handbook for working with the agent. Daily rhythm, common prompts, when to bring Romain in. The agent doesn't need this — you do.

---

## Recommended folder-share approach

If the agent supports pointing at a whole folder (Claude Code does, Codex CLI does), this is the cleanest move:

1. Open the agent inside `~/Library/CloudStorage/OneDrive-Personal/IncircleMe2/IncircleMe2/`
2. The agent now sees every file we've made
3. Paste the prompt above
4. The agent reads in the priority order it specifies

The prompt itself names the four Tier-1 files to read in order, so you don't have to manually attach them.

---

## After the first session — what good looks like

The agent will respond with:

- A three-paragraph summary of what we're building (in its own words — if it gets it wrong, correct in plain English)
- The MVP slice in build order with success criteria
- Three to five clarifying questions

Read the summary carefully. **The biggest risk in the first session is the agent quietly misunderstanding the scope.** Common drifts to watch for:

- Mentioning "follow" or "follower" anywhere (banned vocabulary)
- Suggesting Maps as part of MVP (out of scope — see your most recent map decision)
- Proposing a people-search or matchmaking feature (cut in Pass 40)
- Defaulting to English instead of Catalan-first for the welcome surface
- Suggesting Eventbrite-style flows (we are not Eventbrite)

If you spot any of these, correct immediately. The earlier you set the voice, the less rework you carry through the build.

---

## The clarifying questions you should expect

Likely questions the agent will ask in session one — and your answers:

| Question | Your answer |
|---|---|
| Which payment provider region? | Stripe Connect Express, EU (Spain). |
| Which push provider? | Expo Push for native iOS+Android; Web Push for the web app. |
| Catalan default everywhere or only in Spain? | Default in Barcelona detected by geolocation. Outside Catalonia, device locale → ES → EN fallback. |
| Should the public verification page for certificates be on the marketing web (Next.js) or the app? | Marketing web. `incircleme.com/v/{cert_id}` — read-only, no app install needed for an employer to verify. |
| OAuth providers in MVP? | Google + Apple. Magic-link as the primary path. |
| Maps in MVP? | No. Tappable address that opens the user's default Maps app. Revisit at 100+ events in Gràcia. |
| Founding-host admin UI in MVP? | Just enough to mark hosts as founding-tier, see the yearly renewal bar progress, and waive Program submission fees. Romain will own this; can be minimal. |

Print this table or keep it open in another tab. Saves you from improvising in the first session.

---

## One thing to remember

The agent will be confident — even when wrong. Your job is not to second-guess every line of code; it's to **protect the voice and the scope**. Code can be rewritten. Voice drift compounds.

Every session ends with a one-line check: *"Does this match the prototype, and would Marta recognise it as IncircleMe?"* If yes, ship. If no, fix.

Good first session.

---

*Written 2026-06-10 after Pass 40 (Great Simplification). Companion to `How-to-Work-with-Codex-2026-06-10.md`. Update both whenever scope or vocabulary changes.*
