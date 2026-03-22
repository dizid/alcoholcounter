# alcoholcounter

## Deployment

- **Firebase project ID**: `alcoholcounter-143f5`
- **Firebase auth domain**: `alcoholcounter-143f5.firebaseapp.com`
- **Neon project**: `lucky-cherry-33149869` (shared with crypto.tnxz.nl)
- **Neon database**: `alcohol` (separate from crypto's `neondb`)
- **Netlify site**: alcoholcounter (deploy via Netlify dashboard or CLI)

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
