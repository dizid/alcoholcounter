// Achievements — GET (list), POST (unlock)
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

// The badge ids of src/components/Achievements.vue (T-0636 security pass: before,
// any text of any length was stored, and the same badge could be stored many times).
export const ACHIEVEMENT_TYPES = ['first_week', 'goal_keeper', 'mindful_moment', 'self_aware', 'streak_master', 'month_strong']

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
      if (!ACHIEVEMENT_TYPES.includes(achievement_type)) return json({ error: 'unknown achievement_type' }, 400)

      // Store a badge once per user (the table has no unique index, so check here)
      const [row] = await sql`
        INSERT INTO achievements (user_id, achievement_type)
        SELECT ${userId}, ${achievement_type}
        WHERE NOT EXISTS (
          SELECT 1 FROM achievements WHERE user_id = ${userId} AND achievement_type = ${achievement_type}
        )
        RETURNING id, achievement_type, unlocked_at
      `
      if (!row) return json({ ok: true, already: true })
      return json(row, 201)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-achievements error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
