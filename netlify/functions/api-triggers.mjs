// User triggers — GET (list), POST (create)
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
        SELECT id, created_at, trigger_text, coping_strategy
        FROM user_triggers
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { trigger_text, coping_strategy = null } = body
      if (!trigger_text) return json({ error: 'trigger_text required' }, 400)

      await sql`
        INSERT INTO user_triggers (user_id, trigger_text, coping_strategy)
        VALUES (${userId}, ${trigger_text.trim()}, ${coping_strategy ? coping_strategy.trim() : null})
      `
      return json({ ok: true }, 201)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-triggers error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
