// Client-side day helpers (T-0588). The server decides which local day a drink
// belongs to; the app only needs its own time zone and labels.

// The phone's IANA time zone (e.g. "Asia/Bangkok"), sent with every day request.
export function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// "YYYY-MM-DD" -> Date at local noon (safe for labels on any DST day)
function noon(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

// dateStr plus n calendar days
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// "Sunday, 15 November"
export function longDate(dateStr) {
  return noon(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

// "November"
export function monthName(dateStr) {
  return noon(dateStr).toLocaleDateString('en-GB', { month: 'long' })
}

// "M", "T", ... (first letter of the weekday)
export function dayLetter(dateStr) {
  return noon(dateStr).toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0)
}

// Day of the month as a number
export function dayOfMonth(dateStr) {
  return Number(dateStr.slice(8, 10))
}

// "18:40" for a timestamp, in the phone's own clock
export function timeOfDay(instant) {
  return new Date(instant).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// Standard drinks as shown: "1", "1.2", "12.1"
export function formatStd(n) {
  const value = Math.round(Number(n || 0) * 10) / 10
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

// "1 drink" / "1.2 drinks"
export function drinksLabel(n) {
  const text = formatStd(n)
  return `${text} ${text === '1' ? 'drink' : 'drinks'}`
}
