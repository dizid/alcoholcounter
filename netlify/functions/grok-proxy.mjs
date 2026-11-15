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
import { connectLambda } from '@netlify/blobs'
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { claimAiCall, PER_USER_DAILY_CAP } from './lib/aiUsage.mjs'

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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()
  if (event.httpMethod !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  // 1. Signed-in users only
  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Please sign in to get AI advice.' }, 401)

  // 2. Size and shape of the request
  const rawBody = event.body || ''
  if (!rawBody) return json({ error: 'Request body is empty' }, 400)
  if (Buffer.byteLength(rawBody, event.isBase64Encoded ? 'base64' : 'utf8') > MAX_BODY_BYTES) {
    return json({ error: 'Request too large' }, 413)
  }
  let requestBody
  try {
    const text = event.isBase64Encoded ? Buffer.from(rawBody, 'base64').toString('utf8') : rawBody
    requestBody = JSON.parse(text)
  } catch {
    return json({ error: 'Invalid request body format' }, 400)
  }
  const { userData, requestType } = requestBody || {}
  if (!Object.hasOwn(RESPONSE_KEYS, requestType)) return json({ error: 'Unknown requestType' }, 400)

  if (!process.env.GROK_API_KEY) {
    console.error('grok-proxy: GROK_API_KEY is not set')
    return json({ error: 'Server configuration error' }, 500)
  }

  // 3. Daily caps, counted before anything is spent
  try {
    connectLambda(event) // lets Netlify Blobs work in this Lambda-style function
  } catch {
    // Not on Netlify (local tests): claimAiCall reports 'unavailable' if no store exists
  }
  const claim = await claimAiCall(userId)
  if (claim !== 'ok') {
    const [status, message] = REFUSALS[claim] || REFUSALS.unavailable
    return json({ error: message, reason: claim }, status)
  }

  // 4. Ask xAI
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
      return json({ error: 'The AI service returned an error. Please try again later.' }, 502)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      console.error('grok-proxy: xAI answer had no content')
      return json({ error: 'The AI gave no answer. Please try again.' }, 502)
    }

    return json({ [RESPONSE_KEYS[requestType]]: content })
  } catch (error) {
    console.error('grok-proxy: request to xAI failed:', error instanceof Error ? error.message : String(error))
    return json({ error: 'Failed to get AI response. Please try again later.' }, 500)
  }
}
