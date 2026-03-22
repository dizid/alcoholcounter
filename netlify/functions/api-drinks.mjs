// Drink logs CRUD — GET (list), POST (create), PUT (update), DELETE (delete)
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}
      const limit = Math.min(parseInt(params.limit) || 20, 100)
      const offset = parseInt(params.offset) || 0

      const rows = await sql`
        SELECT id, created_at, location, company, drink_type, mood
        FROM drink_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { location = null, company = null, drink_type = null, mood = null } = body

      const [row] = await sql`
        INSERT INTO drink_logs (user_id, location, company, drink_type, mood)
        VALUES (${userId}, ${location}, ${company}, ${drink_type}, ${mood})
        RETURNING *
      `
      return json(row, 201)
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      const { id, location, company, drink_type, mood } = body
      if (!id) return json({ error: 'id required' }, 400)

      await sql`
        UPDATE drink_logs
        SET location = ${location ?? null},
            company  = ${company ?? null},
            drink_type = ${drink_type ?? null},
            mood     = ${mood ?? null}
        WHERE id = ${id} AND user_id = ${userId}
      `
      return json({ ok: true })
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}')
      const { id } = body
      if (!id) return json({ error: 'id required' }, 400)

      await sql`DELETE FROM drink_logs WHERE id = ${id} AND user_id = ${userId}`
      return json({ ok: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-drinks error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
