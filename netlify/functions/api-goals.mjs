// User goals and settings — GET (fetch), PUT (partial upsert)
// T-0588: besides the weekly limit, a daily limit, an alcohol-free-days-per-week
// goal and a few app settings (coach on/off, the 4 quick drinks, the size of a
// standard drink, and since T-0609 the time of the user's AI consent). The time-zone history in settings is managed by lib/userTime.mjs
// and is never returned or overwritten here.
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

const LIMIT_FIELDS = { weekly_limit: 200, daily_limit: 50, af_days_goal: 7 }
export const DRINK_TYPES = ['beer', 'wine', 'spirit', 'other']
export const STD_DRINK_GRAMS = [8, 10, 12, 14]

// Validates the settings the app may change. Returns { values } or { error }.
export function readSettings(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return { error: 'settings must be an object' }
  const values = {}
  if ('coachOn' in input) {
    if (typeof input.coachOn !== 'boolean') return { error: 'coachOn must be true or false' }
    values.coachOn = input.coachOn
  }
  // T-0609: the user's OK to send their numbers to xAI for the coach. The app sends
  // true/false; the server stores its own time of the yes (aiConsentAt), or null.
  if ('aiConsent' in input) {
    if (typeof input.aiConsent !== 'boolean') return { error: 'aiConsent must be true or false' }
    values.aiConsentAt = input.aiConsent ? new Date().toISOString() : null
  }
  if ('stdDrinkGrams' in input) {
    if (!STD_DRINK_GRAMS.includes(input.stdDrinkGrams)) return { error: `stdDrinkGrams must be one of ${STD_DRINK_GRAMS.join(', ')}` }
    values.stdDrinkGrams = input.stdDrinkGrams
  }
  if ('quickDrinks' in input) {
    const list = input.quickDrinks
    if (!Array.isArray(list) || list.length !== 3) return { error: 'quickDrinks must be 3 drinks' }
    const clean = []
    for (const item of list) {
      const std = Number(item?.std)
      if (!DRINK_TYPES.includes(item?.type) || !Number.isFinite(std) || std <= 0 || std > 10) return { error: 'each quick drink needs a type and std (0-10)' }
      clean.push({ type: item.type, std: Math.round(std * 100) / 100 })
    }
    values.quickDrinks = clean
  }
  return { values }
}

// Validates the limit fields present in body (whole numbers, or null to clear).
export function readLimits(body) {
  const values = {}
  for (const [key, max] of Object.entries(LIMIT_FIELDS)) {
    if (!(key in body)) continue
    const value = body[key]
    if (value === null) { values[key] = null; continue }
    if (!Number.isInteger(value) || value < 0 || value > max) return { error: `${key} must be a whole number from 0 to ${max}` }
    values[key] = value
  }
  return { values }
}

// The public part of the settings (without the time-zone history)
function publicSettings(settings) {
  const { tzHistory, ...rest } = settings && typeof settings === 'object' ? settings : {}
  return rest
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT weekly_limit, daily_limit, af_days_goal, settings FROM user_goals WHERE user_id = ${userId}
      `
      const row = rows[0] || {}
      return json({
        weekly_limit: row.weekly_limit ?? null,
        daily_limit: row.daily_limit ?? null,
        af_days_goal: row.af_days_goal ?? null,
        settings: publicSettings(row.settings),
      })
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      const limits = readLimits(body)
      if (limits.error) return json({ error: limits.error }, 400)
      let settings = { values: {} }
      if ('settings' in body) {
        settings = readSettings(body.settings)
        if (settings.error) return json({ error: settings.error }, 400)
      }

      // Merge with what is stored, so only the fields that were sent change.
      const rows = await sql`
        SELECT weekly_limit, daily_limit, af_days_goal FROM user_goals WHERE user_id = ${userId}
      `
      const merged = { weekly_limit: null, daily_limit: null, af_days_goal: null, ...rows[0], ...limits.values }
      const settingsJson = JSON.stringify(settings.values)

      await sql`
        INSERT INTO user_goals (user_id, weekly_limit, daily_limit, af_days_goal, settings, updated_at)
        VALUES (${userId}, ${merged.weekly_limit}, ${merged.daily_limit}, ${merged.af_days_goal}, ${settingsJson}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
          SET weekly_limit = EXCLUDED.weekly_limit,
              daily_limit  = EXCLUDED.daily_limit,
              af_days_goal = EXCLUDED.af_days_goal,
              settings     = user_goals.settings || EXCLUDED.settings,
              updated_at   = now()
      `
      return json({ ok: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-goals error:', err.message)
    return json({ error: 'Internal server error' }, 500)
  }
}
