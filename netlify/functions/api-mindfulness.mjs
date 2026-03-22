// Mindfulness sessions — GET (all sessions for streak calc), POST (log today)
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
        SELECT session_date
        FROM user_mindfulness_sessions
        WHERE user_id = ${userId}
        ORDER BY session_date DESC
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const today = new Date().toISOString().split('T')[0]

      // Upsert — unique constraint on (user_id, session_date) prevents duplicates
      await sql`
        INSERT INTO user_mindfulness_sessions (user_id, session_date)
        VALUES (${userId}, ${today})
        ON CONFLICT (user_id, session_date) DO NOTHING
      `

      // Return all sessions so the caller can compute the streak
      const rows = await sql`
        SELECT session_date
        FROM user_mindfulness_sessions
        WHERE user_id = ${userId}
        ORDER BY session_date DESC
      `
      return json(rows)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-mindfulness error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
