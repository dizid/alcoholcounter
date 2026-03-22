// User weekly goal — GET (fetch), PUT (upsert)
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT weekly_limit FROM user_goals WHERE user_id = ${userId}
      `
      return json({ weekly_limit: rows[0]?.weekly_limit ?? null })
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      const { weekly_limit } = body

      await sql`
        INSERT INTO user_goals (user_id, weekly_limit, updated_at)
        VALUES (${userId}, ${weekly_limit}, now())
        ON CONFLICT (user_id) DO UPDATE
          SET weekly_limit = EXCLUDED.weekly_limit,
              updated_at   = now()
      `
      return json({ ok: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-goals error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
