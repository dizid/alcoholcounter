// User reflections — GET (list), POST (create)
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

// 'awareness' = breathing, 'intervention' = urge surfing (old tracker); 'breathing'/'meditation' in older tests
const EXERCISE_TYPES = ['awareness', 'intervention', 'breathing', 'meditation']

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT id, created_at, reflection_text, exercise_type
        FROM user_reflections
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { reflection_text, exercise_type } = body
      // T-0623: text only, capped; exercise type from a short known list
      if (typeof reflection_text !== 'string' || !reflection_text.trim()) return json({ error: 'reflection_text required' }, 400)
      const exerciseType = EXERCISE_TYPES.includes(exercise_type) ? exercise_type : null

      await sql`
        INSERT INTO user_reflections (user_id, reflection_text, exercise_type)
        VALUES (${userId}, ${reflection_text.trim().slice(0, 1000)}, ${exerciseType})
      `
      return json({ ok: true }, 201)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-reflections error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
