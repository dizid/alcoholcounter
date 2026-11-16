// Local-day helpers (T-0588): a drink belongs to the calendar day of the user's
// own time zone at the moment it was logged, so the day resets at the user's
// local midnight (the old app used UTC days, which reset at 07:00 in Thailand).
//
// Travel: the user's time zones are kept as a small history in
// user_goals.settings.tzHistory = [{ tz, since }]. Each drink is placed in the
// day of the zone that was in effect when it was logged, so flying home later
// doesn't move old drinks to another day.
// DST: all conversions go through Intl with an IANA zone, so 23- and 25-hour
// days come out right.

export const DEFAULT_TZ = 'UTC'
// Keep the history small: one entry per zone change, the newest last.
export const MAX_TZ_HISTORY = 50

// True when tz is a time zone name Intl accepts (e.g. "Asia/Bangkok").
export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// A valid time zone, or the fallback.
export function cleanTimeZone(tz, fallback = DEFAULT_TZ) {
  return isValidTimeZone(tz) ? tz : fallback
}

// Calendar date ("YYYY-MM-DD") of an instant in a time zone.
export function localDate(instant, tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: cleanTimeZone(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant))
  const get = type => parts.find(p => p.type === type).value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// Offset of a time zone from UTC at an instant, in minutes (Bangkok = +420).
function offsetMinutes(instant, tz) {
  const date = new Date(instant)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(date)
  const get = type => Number(parts.find(p => p.type === type).value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

// The UTC instant of local midnight at the start of a calendar date in tz.
export function startOfLocalDay(dateStr, tz) {
  const zone = cleanTimeZone(tz)
  const [y, m, d] = dateStr.split('-').map(Number)
  const midnightAsUtc = Date.UTC(y, m - 1, d)
  // Two passes settle the offset even when it changes close to midnight (DST).
  let guess = midnightAsUtc - offsetMinutes(midnightAsUtc, zone) * 60000
  guess = midnightAsUtc - offsetMinutes(guess, zone) * 60000
  return new Date(guess)
}

// [start, end) of a local calendar day as UTC Dates (23 or 25 hours on DST days).
export function localDayRange(dateStr, tz) {
  return [startOfLocalDay(dateStr, tz), startOfLocalDay(addDays(dateStr, 1), tz)]
}

// dateStr plus n calendar days ("2026-11-30" + 1 = "2026-12-01").
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// True for a well-formed "YYYY-MM-DD" that is a real date.
export function isDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return addDays(value, 0) === value
}

// The time zone in effect at an instant, from the history (oldest first).
// Before the first entry, the first entry's zone is used.
export function tzAt(instant, history, fallback = DEFAULT_TZ) {
  const list = Array.isArray(history) ? history : []
  if (list.length === 0) return cleanTimeZone(fallback)
  const time = new Date(instant).getTime()
  let zone = list[0].tz
  for (const entry of list) {
    if (new Date(entry.since).getTime() <= time) zone = entry.tz
    else break
  }
  return cleanTimeZone(zone, cleanTimeZone(fallback))
}

// The local day a drink belongs to, using the zone in effect when it was logged.
export function drinkDay(instant, history, fallback = DEFAULT_TZ) {
  return localDate(instant, tzAt(instant, history, fallback))
}

// History with tz appended (from `now`) when it differs from the latest entry.
// Returns the same array when nothing changes.
export function withTimeZone(history, tz, now = new Date()) {
  const list = Array.isArray(history) ? history.filter(e => e && isValidTimeZone(e.tz) && e.since) : []
  if (!isValidTimeZone(tz)) return list
  if (list.length && list[list.length - 1].tz === tz) return list
  return [...list, { tz, since: new Date(now).toISOString() }].slice(-MAX_TZ_HISTORY)
}
