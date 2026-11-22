// netlify/functions/grok-proxy.mjs
// Proxies AI advice requests to the xAI (Grok) API for signed-in users only.
// T-0586: this endpoint used to answer anyone on the internet (no login check,
// any request size, free-text requestType in the prompt) and wrote users'
// drinking data to the function logs. Now:
// - a valid Firebase ID token is required (401 otherwise)
// - only the app's two request types are accepted
// - request size is capped and each data field is trimmed before it goes in the prompt
// - per-user and global daily caps (lib/aiUsage.mjs), counted before xAI is called
// - the answer length is capped, and nothing the user sent is logged
// - T-0636: the user's stored yes to the coach (settings.aiConsentAt, T-0609) is checked
//   here too, so nothing reaches xAI without it even if the app's own check is skipped
// Netlify Functions v2 format (default export, Request -> Response): Netlify Blobs'
// strong-consistency reads, which the counters need, don't work in Lambda-style
// functions ("environment has not been configured with a 'uncachedEdgeURL'").
import { verifyFirebaseToken } from './lib/auth.mjs'
import { claimAiCall, PER_USER_DAILY_CAP } from './lib/aiUsage.mjs'
import { getDb } from './lib/db.mjs'

// requestType -> key of the answer in the response body (what the app reads)
const RESPONSE_KEYS = { mainAdvice: 'advice', mindfulnessTip: 'response' }

// The app sends ~2-10 KB; anything far above that is not the app.
export const MAX_BODY_BYTES = 64 * 1024
// Each data field is cut to this many characters inside the prompt.
const MAX_FIELD_CHARS = 4000
// xAI currently serves the name 'grok-3' with grok-4.3 (kept as before).
const MODEL = 'grok-3'
const MAX_OUTPUT_TOKENS = 1200

// What the app shows when a call is refused (status + message).
const REFUSALS = {
  user_limit: [429, `You've used today's ${PER_USER_DAILY_CAP} AI answers. They reset at midnight (UTC).`],
  global_limit: [429, 'AI advice has reached its daily limit. Please try again tomorrow.'],
  busy: [503, 'AI advice is busy right now. Please try again in a moment.'],
  unavailable: [503, 'AI advice is unavailable right now. Please try again later.'],
  no_consent: [403, 'Please agree to share your numbers with the coach first: reload the page and tap "Ask the coach".'],
}

// True when the user's settings hold the time of their yes to the coach. api-goals stamps it
// on "I agree" and clears it when the coach is turned off in Me (T-0609).
export async function hasAiConsent(userId) {
  const sql = getDb()
  const rows = await sql`SELECT settings->>'aiConsentAt' AS consent_at FROM user_goals WHERE user_id = ${userId}`
  return Boolean(rows[0]?.consent_at)
}

// JSON of a user data field, cut to MAX_FIELD_CHARS so the prompt stays small.
function field(value, fallback) {
  const text = JSON.stringify(value ?? fallback)
  return text.length > MAX_FIELD_CHARS ? `${text.slice(0, MAX_FIELD_CHARS)}…` : text
}

// Builds the prompt (same wording as before; requestType now comes from the allow-list only).
export function buildPrompt(requestType, userData) {
  const moodData = userData && typeof userData.moodCorrelations === 'object' && userData.moodCorrelations !== null
    ? userData.moodCorrelations
    : {}
  const moodInsight = Object.entries(moodData)
    .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))
    .slice(0, 3)
    .map(([mood, data]) => `${String(mood).slice(0, 40)}: ${Number(data?.percentage) || 0}%`)
    .join(', ')

  return `Provide personalized ${requestType} based on the user's full data:
- Triggers: ${field(userData?.triggers, [])}
- Historical Drinking Patterns: ${field(userData?.historicalDrinkingPatterns, {})}
- Context Frequencies: ${field(userData?.contextFrequencies, {})}
- Mood When Drinking: ${moodInsight || 'No mood data yet'}
- Reflections: ${field(userData?.reflections, [])}

Structure the advice in short paragraphs (1-2 sentences each) with sections:
1. Mood & Emotional Patterns (highlight correlations like "You drink X% more when feeling stressed")
2. Triggers Analysis
3. Drinking Patterns Insights
4. Personalized Tips

Keep it encouraging, concise, and supportive, aligned with CBT principles. Be specific about mood correlations if data is available.`
}

// Same headers as lib/auth.mjs json(), as a v2 Response
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...CORS_HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    })
  }
  if (req.method !== 'POST') return reply({ error: 'Method Not Allowed' }, 405)

  // 1. Signed-in users only (the shared helper reads Lambda-style headers)
  const userId = await verifyFirebaseToken({ headers: { authorization: req.headers.get('authorization') || '' } })
  if (!userId) return reply({ error: 'Please sign in to get AI advice.' }, 401)

  // 2. Size and shape of the request
  const declaredLength = Number(req.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) return reply({ error: 'Request too large' }, 413)
  const rawBody = await req.text()
  if (!rawBody) return reply({ error: 'Request body is empty' }, 400)
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return reply({ error: 'Request too large' }, 413)
  let requestBody
  try {
    requestBody = JSON.parse(rawBody)
  } catch {
    return reply({ error: 'Invalid request body format' }, 400)
  }
  const { userData, requestType } = requestBody || {}
  if (!Object.hasOwn(RESPONSE_KEYS, requestType)) return reply({ error: 'Unknown requestType' }, 400)

  if (!process.env.GROK_API_KEY) {
    console.error('grok-proxy: GROK_API_KEY is not set')
    return reply({ error: 'Server configuration error' }, 500)
  }

  // 3. The user's yes to the coach; fails closed when the database can't be read
  let consented
  try {
    consented = await hasAiConsent(userId)
  } catch (error) {
    console.error('grok-proxy: consent check failed:', error instanceof Error ? error.message : String(error))
    const [status, message] = REFUSALS.unavailable
    return reply({ error: message, reason: 'unavailable' }, status)
  }
  if (!consented) {
    const [status, message] = REFUSALS.no_consent
    return reply({ error: message, reason: 'no_consent' }, status)
  }

  // 4. Daily caps, counted before anything is spent
  const claim = await claimAiCall(userId)
  if (claim !== 'ok') {
    const [status, message] = REFUSALS[claim] || REFUSALS.unavailable
    return reply({ error: message, reason: claim }, status)
  }

  // 5. Ask xAI
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: buildPrompt(requestType, userData) }],
      }),
    })

    if (!response.ok) {
      // Log the status only: xAI error texts can echo parts of the prompt (user data)
      console.error('grok-proxy: xAI API error', response.status)
      return reply({ error: 'The AI service returned an error. Please try again later.' }, 502)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      console.error('grok-proxy: xAI answer had no content')
      return reply({ error: 'The AI gave no answer. Please try again.' }, 502)
    }

    return reply({ [RESPONSE_KEYS[requestType]]: content })
  } catch (error) {
    console.error('grok-proxy: request to xAI failed:', error instanceof Error ? error.message : String(error))
    return reply({ error: 'Failed to get AI response. Please try again later.' }, 500)
  }
}
