# alcoholcounter

## Deployment

- **Firebase project ID**: `alcoholcounter-143f5`
- **Firebase auth domain**: `alcoholcounter-143f5.firebaseapp.com`
- **Neon project**: `lucky-cherry-33149869` (shared with crypto.tnxz.nl)
- **Neon database**: `alcohol` (separate from crypto's `neondb`)
- **Netlify site**: alcoholcounter, site ID `2679a0d3-65f8-4f20-a384-96964038f39e`
- **Production domain**: https://alcohol.dizid.com · **GitHub**: dizid/alcoholcounter (default branch `master`)
- **Deploy**: laptop deploy only (Netlify Free plan build minutes): commit with `[skip netlify]` in the message, push, then `NETLIFY_SITE_ID=2679a0d3-65f8-4f20-a384-96964038f39e npx netlify deploy --build --prod` from a checkout with a real `node_modules`. Auto-builds on push are still ON for this site.
- **Sign-in**: Firebase Auth, Google only (email/password and anonymous are disabled in Firebase)

## Product facts (kept by Claude, Nov 15 2026)
- Users: 1 (Marc). AI advice = `netlify/functions/grok-proxy.mjs` (v2 function): signed-in users only, 2 request types (mainAdvice, mindfulnessTip), max 20 answers per user per UTC day and 150 for all users together (`lib/aiUsage.mjs`, Netlify Blobs store `ai-calls`, fails closed). Model name `grok-3`, which xAI serves as grok-4.3 (~$0.006 per answer).
- `src/style.css` (theme variables, Plus Jakarta Sans, the reset meant to replace Pico CSS) is NOT imported anywhere; loading it changes the whole look (needs Marc's OK, see AI-COMPANY output/alcohol-overhaul-plan.md).
- **Privacy + consent (T-0609, live Nov 17 2026):** `/privacy` (`src/views/PrivacyView.vue`, public) lists every place data goes; keep it true when that changes. Google Analytics (G-MN2MDNRW4L) loads only after "Allow" in `src/components/ConsentBanner.vue` (choice in localStorage `analyticsConsent`; switch in Me → Privacy; logic in `src/lib/analytics.js`, not in index.html). The coach asks once before the first xAI call: the app sends `settings.aiConsent` true/false, the server stores `settings.aiConsentAt` (its own time) or null; Coach off in Me withdraws it. Account deletion is by email (marc@dizid.com, within one month); there's no in-app delete-all yet. Fonts still load from Google Fonts (named on the privacy page).
- **Redesign (T-0588, live since Nov 17 2026, merged to master):** Today / Log / Insights / Me with a bottom nav, theme in `src/assets/theme.css` (Wim's tokens; `styles.css` is no longer loaded). The old MainTracker/Dashboard views stay in the repo but have no route (`/dashboard` redirects to `/insights`).
- **Days end at the user's local midnight** (T-0588): the app sends `tz`; `netlify/functions/lib/localDay.mjs` + `lib/userTime.mjs` place each drink in the local day of the zone in effect when it was logged (zone history in `user_goals.settings.tzHistory`, so travel doesn't move old drinks). The AI caps stay per UTC day.
- **DB (applied live Nov 16 2026, additive, `migrations/2026-11-16-t0588-redesign.sql`):** `drink_logs` + `std_drinks` (default 1), `size`, `trigger`, `note`; `user_goals` + `daily_limit`, `af_days_goal`, `settings` (jsonb: coachOn, quickDrinks, stdDrinkGrams, tzHistory); new table `alcohol_free_days (user_id, day)`. A day counts as alcohol-free only when marked ("Nothing today") and nothing is logged that day.
- "A thought for today" on Today is written from the user's numbers (no AI call); the AI is only called on "Ask the coach". The AI reply has no remaining-count, so the "N questions left" hint from the review is not shown.
- Netlify Blobs: Lambda-style functions (`export const handler`) can't do strong-consistency reads; and `@netlify/blobs` reports any conditional-write status except 412 as `modified`, so only count a write that returns an ETag.

### Env vars required

Frontend (Vite / `VITE_` prefix):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
```

Netlify functions (server-side):
```
ALCOHOL_DATABASE_URL   # Neon connection string for the alcohol database
VITE_FIREBASE_PROJECT_ID  # Also needed by auth.mjs for JWT issuer/audience check
GROK_API_KEY
```
