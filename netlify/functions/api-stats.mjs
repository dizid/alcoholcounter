// Drink statistics — GET ?type=today|weekly|historical|context|mood
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()
  const params = event.queryStringParameters || {}
  const type = params.type

  try {
    if (type === 'today') {
      const today = new Date().toISOString().split('T')[0]
      const [{ count }] = await sql`
        SELECT COUNT(*) AS count
        FROM drink_logs
        WHERE user_id = ${userId}
          AND created_at >= ${today + 'T00:00:00Z'}
          AND created_at <= ${today + 'T23:59:59Z'}
      `
      return json({ count: parseInt(count) })
    }

    if (type === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const [{ count }] = await sql`
        SELECT COUNT(*) AS count
        FROM drink_logs
        WHERE user_id = ${userId} AND created_at >= ${weekAgo}
      `
      return json({ count: parseInt(count) })
    }

    if (type === 'historical') {
      const days = Math.min(parseInt(params.days) || 30, 365)
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const rows = await sql`
        SELECT created_at
        FROM drink_logs
        WHERE user_id = ${userId} AND created_at >= ${startDate}
        ORDER BY created_at ASC
      `

      // Group by locale date string to match existing frontend logic
      const countsByDate = {}
      rows.forEach(row => {
        const date = new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        countsByDate[date] = (countsByDate[date] || 0) + 1
      })
      return json(countsByDate)
    }

    if (type === 'context') {
      const rows = await sql`
        SELECT location, company, drink_type, mood
        FROM drink_logs
        WHERE user_id = ${userId}
      `

      const freq = { location: {}, company: {}, drink_type: {}, mood: {} }
      rows.forEach(log => {
        Object.keys(freq).forEach(key => {
          if (log[key]) {
            freq[key][log[key]] = (freq[key][log[key]] || 0) + 1
          }
        })
      })
      return json(freq)
    }

    if (type === 'mood') {
      const rows = await sql`
        SELECT mood FROM drink_logs WHERE user_id = ${userId} AND mood IS NOT NULL
      `

      const moodCounts = {}
      rows.forEach(row => {
        moodCounts[row.mood] = (moodCounts[row.mood] || 0) + 1
      })

      const total = rows.length
      const moodPercentages = {}
      Object.entries(moodCounts).forEach(([mood, count]) => {
        moodPercentages[mood] = {
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })
      return json(moodPercentages)
    }

    return json({ error: 'type param required: today|weekly|historical|context|mood' }, 400)
  } catch (err) {
    console.error('api-stats error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
}
