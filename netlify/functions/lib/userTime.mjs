// The user's time-zone history (T-0588), kept in user_goals.settings.tzHistory.
// The app sends the phone's time zone (?tz= or body.tz); a change is recorded
// once, so drinks keep the local day of the place they were logged in.
import { cleanTimeZone, isValidTimeZone, withTimeZone, localDate, addDays, drinkDay } from './localDay.mjs'

// Reads the history and records `clientTz` when it is new.
// Returns { history, tz } where tz is the zone to use for "today".
export async function getUserTime(sql, userId, clientTz) {
  const rows = await sql`SELECT settings FROM user_goals WHERE user_id = ${userId}`
  const settings = rows[0]?.settings && typeof rows[0].settings === 'object' ? rows[0].settings : {}
  const history = Array.isArray(settings.tzHistory) ? settings.tzHistory : []

  const latest = history.length ? history[history.length - 1].tz : undefined
  if (!isValidTimeZone(clientTz)) return { history, tz: cleanTimeZone(latest) }
  if (latest === clientTz) return { history, tz: clientTz }

  // A new zone (first visit or travel): record it from now on.
  const updated = withTimeZone(history, clientTz)
  const historyJson = JSON.stringify(updated)
  await sql`
    INSERT INTO user_goals (user_id, settings, updated_at)
    VALUES (${userId}, jsonb_build_object('tzHistory', ${historyJson}::jsonb), now())
    ON CONFLICT (user_id) DO UPDATE
      SET settings = user_goals.settings || jsonb_build_object('tzHistory', ${historyJson}::jsonb),
          updated_at = now()
  `
  return { history: updated, tz: clientTz }
}

// The UTC window that surely contains every drink of local days from..to
// (any zone is within ±14 h of UTC, so a day of margin on each side is enough).
export function fetchWindow(from, to) {
  return [`${addDays(from, -1)}T00:00:00Z`, `${addDays(to, 2)}T00:00:00Z`]
}

// Today's local date for the user.
export function todayFor(tz, now = new Date()) {
  return localDate(now, tz)
}

// Adds `day` (the user's local date) to each row and keeps only from..to.
export function withDays(rows, history, tz, from, to) {
  return rows
    .map(row => ({ ...row, day: drinkDay(row.created_at, history, tz) }))
    .filter(row => row.day >= from && row.day <= to)
}
