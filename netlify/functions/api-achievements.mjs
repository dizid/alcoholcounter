// Achievements — GET (list), POST (unlock)
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
        SELECT id, achievement_type, unlocked_at
        FROM achievements
        WHERE user_id = ${userId}
        ORDER BY unlocked_at DESC
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { achievement_type } = body
      if (!achievement_type) return json({ error: 'achievement_type required' }, 400)

      const [row] = await sql`
        INSERT INTO achievements (user_id, achievement_type)
        VALUES (${userId}, ${achievement_type})
        RETURNING *
      `
      return json(row, 201)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-achievements error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
