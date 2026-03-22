# DrinkTracker — alcoholcounter

Mindful alcohol tracking app with CBT tools, AI insights, and mindfulness exercises.

**Live:** https://alcohol.dizid.com

## Stack

- **Frontend:** Vue 3 + Vite, Pinia, Vue Router
- **Auth:** Firebase Auth (Google Sign-In)
- **Database:** Neon PostgreSQL (`alcohol` database in project `lucky-cherry-33149869`)
- **API:** Netlify Functions (ESM `.mjs`) — JWT-verified, server-side DB access
- **AI:** X.AI Grok via `grok-proxy.cjs` Netlify function
- **Hosting:** Netlify — site `alcoholcounter`, domain `alcohol.dizid.com`

## Local development

```bash
npm install
npm run dev
```

Requires `.env` with:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
ALCOHOL_DATABASE_URL=
GROK_API_KEY=
```

## Netlify Functions

All API functions live in `netlify/functions/` and use shared libs in `netlify/functions/lib/`:

| Function | Purpose |
|----------|---------|
| `api-drinks.mjs` | Drink log CRUD (GET/POST/PUT/DELETE) |
| `api-stats.mjs` | Aggregated stats (today, weekly, historical, context, mood) |
| `api-triggers.mjs` | CBT trigger logging |
| `api-reflections.mjs` | Mindfulness reflections |
| `api-mindfulness.mjs` | Mindfulness session streak tracking |
| `api-achievements.mjs` | Achievement badges |
| `api-goals.mjs` | Weekly drink goal |
| `grok-proxy.cjs` | X.AI Grok AI advice proxy (leave untouched) |

All functions verify Firebase JWT tokens via `lib/auth.mjs` before touching the database.

## Database schema migration

Run once to create tables in Neon:
```bash
ALCOHOL_DATABASE_URL="..." node scripts/migrate-alcohol.mjs
```

## Deployment

Push to `master` → Netlify auto-deploys.

Firebase project: `alcoholcounter-143f5`
Neon project: `lucky-cherry-33149869` / database: `alcohol`
