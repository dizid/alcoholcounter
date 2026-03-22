// Firebase JWT verification for Netlify functions
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// Verifies the Firebase Bearer token in the request Authorization header.
// Returns the Firebase UID (string) on success, or null if invalid/missing.
export async function verifyFirebaseToken(request) {
  const header = request.headers['authorization'] || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${process.env.VITE_FIREBASE_PROJECT_ID}`,
      audience: process.env.VITE_FIREBASE_PROJECT_ID,
    })
    return payload.sub  // Firebase UID
  } catch {
    return null
  }
}

// Convenience helper for consistent JSON responses
export function json(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
    body: JSON.stringify(body),
  }
}

// CORS preflight response
export function preflight() {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
    body: '',
  }
}
