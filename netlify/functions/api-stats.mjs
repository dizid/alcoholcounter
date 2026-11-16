// Drink statistics — GET ?type=days|insights|today|weekly|historical|context|mood
// T-0588: `days` and `insights` count by the user's local day (?tz=, local-midnight
// rule) and in standard drinks; the older types are kept for older app versions.
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'
import { isDateString, addDays } from './lib/localDay.mjs'
import { getUserTime, fetchWindow, withDays, todayFor } from './lib/userTime.mjs'
import { dailySeries, insightsSummary, RANGES } from './lib/insights.mjs'

// Drinks (with local `day`) and marked alcohol-free days for local days from..to
async function loadDays(sql, userId, history, tz, from, to) {
  const [start, end] = fetchWindow(from, to)
  const rows = await sql`
    SELECT created_at, std_drinks, trigger, mood FROM drink_logs
    WHERE user_id = ${userId} AND created_at >= ${start} AND created_at < ${end}
  `
  const af = await sql`
    SELECT to_char(day, 'YYYY-MM-DD') AS day FROM alcohol_free_days
    WHERE user_id = ${userId} AND day >= ${from} AND day <= ${to}
  `
  return { rows: withDays(rows, history, tz, from, to), afDays: af.map(r => r.day) }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()
  const params = event.queryStringParameters || {}
  const type = params.type

  try {
    // Per local day from..to (default: the last 7 days): { today, days: [{ day, std, count, af }] }
    if (type === 'days') {
      const { history, tz } = await getUserTime(sql, userId, params.tz)
      const today = todayFor(tz)
      const to = params.to ?? today
      const from = params.from ?? addDays(to, -6)
      if (!isDateString(from) || !isDateString(to) || from > to) return json({ error: 'from and to must be dates, from <= to' }, 400)
      if (addDays(from, 400) < to) return json({ error: 'at most 400 days' }, 400)
      const { rows, afDays } = await loadDays(sql, userId, history, tz, from, to)
      return json({ today, days: dailySeries(rows, afDays, from, to) })
    }

    // The Insights screen for range=week|month|year (ending today)
    if (type === 'insights') {
      const range = params.range ?? 'month'
      if (!RANGES[range]) return json({ error: 'range must be week, month or year' }, 400)
      const { history, tz } = await getUserTime(sql, userId, params.tz)
      const today = todayFor(tz)
      // Load this period and the one before it (for "vs last month")
      const from = addDays(today, -(2 * RANGES[range] - 1))
      const { rows, afDays } = await loadDays(sql, userId, history, tz, from, today)
      return json({ today, ...insightsSummary(rows, afDays, today, range) })
    }

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
