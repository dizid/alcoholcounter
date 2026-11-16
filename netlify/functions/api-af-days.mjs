// Alcohol-free days (T-0588) — GET ?from=&to= (list), POST { day } (mark), DELETE { day } (unmark)
// A day only counts as alcohol-free when the user says so ("Nothing today"),
// because an empty day could also mean "not logged". A day that has drinks is
// never alcohol-free: the stats ignore a mark on such a day, and marking one is refused.
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'
import { isDateString, addDays } from './lib/localDay.mjs'
import { getUserTime, fetchWindow, withDays, todayFor } from './lib/userTime.mjs'

const MAX_RANGE_DAYS = 400
// How far back a day may still be marked (the "confirm yesterday" case and the Log strip)
const MAX_MARK_DAYS_BACK = 14

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const { from, to } = event.queryStringParameters || {}
      if (!isDateString(from) || !isDateString(to) || from > to) return json({ error: 'from and to must be dates, from <= to' }, 400)
      if (addDays(from, MAX_RANGE_DAYS) < to) return json({ error: `at most ${MAX_RANGE_DAYS} days` }, 400)
      const rows = await sql`
        SELECT to_char(day, 'YYYY-MM-DD') AS day FROM alcohol_free_days
        WHERE user_id = ${userId} AND day >= ${from} AND day <= ${to}
        ORDER BY day
      `
      return json(rows.map(r => r.day))
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}')
      const { day } = body
      if (!isDateString(day)) return json({ error: 'day must be a date (YYYY-MM-DD)' }, 400)

      if (event.httpMethod === 'DELETE') {
        await sql`DELETE FROM alcohol_free_days WHERE user_id = ${userId} AND day = ${day}`
        return json({ ok: true })
      }

      const { history, tz } = await getUserTime(sql, userId, body.tz)
      const today = todayFor(tz)
      if (day > today) return json({ error: 'day is in the future' }, 400)
      if (day < addDays(today, -MAX_MARK_DAYS_BACK)) return json({ error: 'day is too long ago' }, 400)

      // Refuse when the day already has drinks
      const [start, end] = fetchWindow(day, day)
      const rows = await sql`
        SELECT created_at FROM drink_logs
        WHERE user_id = ${userId} AND created_at >= ${start} AND created_at < ${end}
      `
      if (withDays(rows, history, tz, day, day).length > 0) return json({ error: 'This day has drinks logged' }, 409)

      await sql`
        INSERT INTO alcohol_free_days (user_id, day) VALUES (${userId}, ${day})
        ON CONFLICT (user_id, day) DO NOTHING
      `
      return json({ ok: true, day }, 201)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('api-af-days error:', err.message)
    return json({ error: 'Internal server error' }, 500)
  }
}
