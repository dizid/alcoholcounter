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
