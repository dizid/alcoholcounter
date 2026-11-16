// Drink logs CRUD — GET (list), POST (create), PUT (update), DELETE (delete)
// T-0588: drinks carry standard drinks, size, trigger and a note; a drink can be
// logged for an earlier time; GET ?from=&to=&tz= returns the drinks of the user's
// local days (local-midnight rule, see lib/localDay.mjs).
import { verifyFirebaseToken, json, preflight } from './lib/auth.mjs'
import { getDb } from './lib/db.mjs'
import { isDateString, addDays } from './lib/localDay.mjs'
import { getUserTime, fetchWindow, withDays } from './lib/userTime.mjs'

export const SIZES = ['small', 'regular', 'large']
const MAX_STD_DRINKS = 20
const MAX_RANGE_DAYS = 400
// Short text fields and their max length
const TEXT_LIMITS = { drink_type: 40, mood: 40, trigger: 40, location: 80, company: 80, note: 500 }

// Validates the drink fields present in body. Returns { values } or { error }.
// Only keys that are present are returned, so PUT can update just those.
export function readDrinkFields(body, now = new Date()) {
  const values = {}
  for (const [key, max] of Object.entries(TEXT_LIMITS)) {
    if (!(key in body)) continue
    const value = body[key]
    if (value === null || value === '') { values[key] = null; continue }
    if (typeof value !== 'string') return { error: `${key} must be text` }
    values[key] = value.trim().slice(0, max) || null
  }
  if ('std_drinks' in body) {
    const n = Number(body.std_drinks)
    if (!Number.isFinite(n) || n <= 0 || n > MAX_STD_DRINKS) return { error: `std_drinks must be between 0 and ${MAX_STD_DRINKS}` }
    values.std_drinks = Math.round(n * 100) / 100
  }
  if ('size' in body) {
    if (body.size !== null && !SIZES.includes(body.size)) return { error: 'size must be small, regular or large' }
    values.size = body.size
  }
  if ('created_at' in body && body.created_at !== null) {
    const when = new Date(body.created_at)
    if (Number.isNaN(when.getTime())) return { error: 'created_at must be a date' }
    if (when.getTime() > now.getTime() + 5 * 60000) return { error: 'created_at is in the future' }
    if (when.getTime() < now.getTime() - MAX_RANGE_DAYS * 86400000) return { error: 'created_at is too long ago' }
    values.created_at = when.toISOString()
  }
  return { values }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight()

  const userId = await verifyFirebaseToken(event)
  if (!userId) return json({ error: 'Unauthorized' }, 401)

  const sql = getDb()

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}

      // Drinks of local days from..to (the new Log and Today screens)
      if (params.from || params.to) {
        const { from, to } = params
        if (!isDateString(from) || !isDateString(to) || from > to) return json({ error: 'from and to must be dates, from <= to' }, 400)
        if (addDays(from, MAX_RANGE_DAYS) < to) return json({ error: `at most ${MAX_RANGE_DAYS} days` }, 400)
        const { history, tz } = await getUserTime(sql, userId, params.tz)
        const [start, end] = fetchWindow(from, to)
        const rows = await sql`
          SELECT id, created_at, location, company, drink_type, mood, std_drinks, size, trigger, note
          FROM drink_logs
          WHERE user_id = ${userId} AND created_at >= ${start} AND created_at < ${end}
          ORDER BY created_at DESC
        `
        return json(withDays(rows, history, tz, from, to))
      }

      // Newest first, paged (kept for older app versions)
      const limit = Math.min(parseInt(params.limit) || 20, 100)
      const offset = parseInt(params.offset) || 0
      const rows = await sql`
        SELECT id, created_at, location, company, drink_type, mood, std_drinks, size, trigger, note
        FROM drink_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return json(rows)
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { values, error } = readDrinkFields(body)
      if (error) return json({ error }, 400)
      if (typeof body.tz === 'string') await getUserTime(sql, userId, body.tz)

      const [row] = await sql`
        INSERT INTO drink_logs (user_id, created_at, location, company, drink_type, mood, std_drinks, size, trigger, note)
        VALUES (
          ${userId}, ${values.created_at ?? new Date().toISOString()},
          ${values.location ?? null}, ${values.company ?? null}, ${values.drink_type ?? null}, ${values.mood ?? null},
          ${values.std_drinks ?? 1}, ${values.size ?? null}, ${values.trigger ?? null}, ${values.note ?? null}
        )
        RETURNING id, created_at, location, company, drink_type, mood, std_drinks, size, trigger, note
      `
      return json(row, 201)
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}')
      if (!body.id) return json({ error: 'id required' }, 400)
      const { values, error } = readDrinkFields(body)
      if (error) return json({ error }, 400)
      const keys = Object.keys(values)
      if (keys.length === 0) return json({ error: 'nothing to update' }, 400)

      // Only the fields that were sent change; the others keep their value.
      await sql`
        UPDATE drink_logs SET ${sql(values, keys)}
        WHERE id = ${body.id} AND user_id = ${userId}
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
    console.error('api-drinks error:', err.message)
    return json({ error: 'Internal server error' }, 500)
  }
}
