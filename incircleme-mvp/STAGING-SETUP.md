# IncircleMe — Staging setup checklist (founder edition)

A step-by-step to get the **whole app on your Samsung**, signing in with **Google**, talking to a real staging server. **Staging only · Stripe in TEST mode · no real money.**

You'll do the **account sign-ups, the website clicks, and pasting secrets**. Your engineer runs the **terminal commands** with you on the call (marked `⌨️`). Budget ~1 hour. Total cost ≈ **€6–9/month** (one small server + free tiers).

> 🔑 = a value you copy now and paste later. Keep a notes file open for these.

---

## Part A — Create the accounts (all free to start)
Sign up for each (use your founder email). Don't configure anything yet.
- [ ] **Fly.io** — fly.io (hosts the API). Add a card (needed even on the free allowance; we stay tiny).
- [ ] **Neon** — neon.tech (the database).
- [ ] **Upstash** — upstash.com (Redis).
- [ ] **Stripe** — stripe.com. **Important:** leave the dashboard toggle on **“Test mode”** (top-right) the whole time.
- [ ] **Expo** — expo.dev (builds the Android app).
- [ ] **Google Cloud** — console.cloud.google.com (the “Sign in with Google”).

---

## Part B — Database + Redis (copy two connection strings)
- [ ] **Neon:** New Project → region **Europe**. On the dashboard, copy the **Connection string** → save as 🔑 `DATABASE_URL`.
- [ ] **Upstash:** Create Database → **Redis** → region **EU**. Open it → copy the connection URL (the `rediss://…` one) → save as 🔑 `REDIS_URL`.
- [ ] Generate a random app secret: `⌨️ openssl rand -base64 32` → save the output as 🔑 `JWT_SECRET`.

---

## Part C — Deploy the API to Fly
> ⚠️ **Order matters:** the API **refuses to boot in production unless both Stripe secrets are set** (a safety guard so it can never silently run charging no one). So we create the Stripe webhook and set its secrets **before** the first `fly deploy`. That's fine because your API URL is fixed the moment `fly launch` finishes — long before we deploy.

- [ ] `⌨️ fly auth login` (opens the browser — you approve).
- [ ] `⌨️ fly launch --no-deploy --copy-config --name incircleme-staging` (run from the `incircleme-mvp` folder — it uses the `fly.toml` already in the repo; say **No** to Postgres/Redis offers, we use Neon/Upstash). **Your API URL is now fixed: `https://incircleme-staging.fly.dev`** — you'll need it in the Stripe step next.
- [ ] `⌨️ fly volumes create uploads --region ams --size 1` (1 GB for uploaded photos).
- [ ] **Paste the base secrets** (each is a separate command — paste your saved 🔑 values):
  ```
  ⌨️ fly secrets set DATABASE_URL="<your Neon string>"
  ⌨️ fly secrets set REDIS_URL="<your Upstash rediss URL>"
  ⌨️ fly secrets set JWT_SECRET="<your random secret>"
  ```
- [ ] **Stripe test webhook + keys — set these *before* deploying** (in Stripe, still **Test mode**):
  - **Developers → Webhooks → Add endpoint.**
    - Endpoint URL: `https://incircleme-staging.fly.dev/webhooks/stripe`
    - Events: select **`payment_intent.succeeded`** and **`payment_intent.payment_failed`**.
  - Copy the endpoint’s **Signing secret** (`whsec_…`) → `⌨️ fly secrets set STRIPE_WEBHOOK_SECRET="whsec_…"`
  - Copy your **Test secret key** (Developers → API keys → `sk_test_…`) → `⌨️ fly secrets set STRIPE_SECRET_KEY="sk_test_…"`
  - Copy your **Test publishable key** (`pk_test_…`) → save as 🔑 (goes into the app in Part E).
- [ ] `⌨️ fly deploy` — with the Stripe secrets in place, this builds, **runs the database migrations automatically**, and starts the API + worker. When it finishes, open `https://incircleme-staging.fly.dev/health` in a browser — you should see a small JSON object with **`status: ok`** (plus `db` and `ts` fields).
- [ ] **Seed a bit of content:** `⌨️ fly ssh console -C "pnpm --filter @incircleme/api exec tsx scripts/seedStaging.ts"` (adds two hosts, a few events, and one verified Program).

*(Google sign-in comes next in Part D — the server boots fine without it; Google just isn't wired until you set it.)*

---

## Part D — Google “Sign in with Google”
The Android app needs a fingerprint that Expo generates, so we do **Expo first**, then Google.

1. **Expo:** `⌨️ eas login` → then `⌨️ eas credentials` → choose **Android → Production/preview keystore → set up a new keystore**. It prints a **SHA-1 fingerprint** → save as 🔑 `SHA1`.
2. **Google Cloud:**
   - [ ] **APIs & Services → OAuth consent screen** → **External** → fill the app name/email → **Add test users** → add **your own Gmail**. (No Google review needed for staging.)
   - [ ] **Credentials → Create credentials → OAuth client ID → Web application.** Copy its **Client ID** → save as 🔑 `GOOGLE_WEB_CLIENT_ID`.
   - [ ] **Create credentials → OAuth client ID → Android.** Package name: **`com.incircleme.app`**. SHA-1: paste your 🔑 `SHA1`. (You don’t need to copy anything from this one — it just authorizes the app.)
3. **Give the server the Web client ID:** `⌨️ fly secrets set GOOGLE_CLIENT_ID="<GOOGLE_WEB_CLIENT_ID>"`

---

## Part E — Build the Android app (APK) and install it
- [ ] **Put your public keys into the app build.** In `apps/mobile/eas.json`, replace the two placeholders:
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` → your `pk_test_…`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` → your `GOOGLE_WEB_CLIENT_ID`
  *(`EXPO_PUBLIC_API_URL` is already set to the staging server. These are public keys, not secrets — fine to keep in the file.)*
- [ ] `⌨️ eas build -p android --profile preview` — takes ~10–15 min. It ends with an **APK download link**.
- [ ] On the **Samsung**: open that link → download → tap the APK → allow **“install from this source”** once → install **IncircleMe**.

---

## Part F — Test end-to-end (the payoff)
- [ ] Open **IncircleMe** → **Profile** → **Sign in with Google** → pick your Gmail.
- [ ] Browse **Home** → open an event → **book** it. Use Stripe **test card** `4242 4242 4242 4242`, any future date, any CVC. → you get a **ticket**.
- [ ] Check **Bookings**, the event **Circle**, and **Programs** (the verified “Hands in Clay”).
- [ ] Language: tap the floating **EN / CA / ES** to flip the whole app.

If anything errors, your engineer reads the server logs with `⌨️ fly logs`.

---

### Notes
- **No dev shortcuts:** the dev-login and the magic-link paste box are automatically **absent** in this build — Google is the only way in, exactly as in production.
- **Money:** Stripe is in **Test mode** — `4242…` charges are fake; no real money moves.
- **What’s deferred:** booking-confirmation emails are off (sign-in is Google, so not needed); file uploads use a small server volume (production would use cloud storage). iOS isn’t set up (Android only for now).
