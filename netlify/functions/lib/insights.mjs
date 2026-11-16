// Pure stats for the Today and Insights screens (T-0588). Input rows already
// carry `day` (the user's local date, lib/userTime.mjs withDays).
import { addDays } from './localDay.mjs'

export const RANGES = { week: 7, month: 30, year: 365 }

// Rounds to 1 decimal (standard drinks are shown as 1.8, 12.1, ...)
const round1 = n => Math.round(n * 10) / 10

// One entry per local day from..to: total standard drinks, number of drinks,
// and af = marked alcohol-free AND nothing logged that day.
export function dailySeries(rows, afDays, from, to) {
  const marked = new Set(afDays)
  const byDay = new Map()
  for (const row of rows) {
    const entry = byDay.get(row.day) || { std: 0, count: 0 }
    entry.std += Number(row.std_drinks ?? 1)
    entry.count += 1
    byDay.set(row.day, entry)
  }
  const days = []
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const entry = byDay.get(day) || { std: 0, count: 0 }
    days.push({ day, std: round1(entry.std), count: entry.count, af: entry.count === 0 && marked.has(day) })
  }
  return days
}

// The most frequent non-empty value of `key` among rows: { name, count, pct } or null.
export function topValue(rows, key) {
  const counts = new Map()
  let withValue = 0
  for (const row of rows) {
    const value = row[key]
    if (!value) continue
    withValue += 1
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  if (counts.size === 0) return null
  const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return { name, count, pct: Math.round((count / withValue) * 100) }
}

// The Insights summary for a range ending today.
// rows: drinks of both this period and the one before (with `day`);
// afDays: marked alcohol-free days in this period.
export function insightsSummary(rows, afDays, today, range) {
  const length = RANGES[range]
  const from = addDays(today, -(length - 1))
  const prevFrom = addDays(from, -length)
  const current = rows.filter(r => r.day >= from && r.day <= today)
  const previous = rows.filter(r => r.day >= prevFrom && r.day < from)
  const sum = list => list.reduce((total, r) => total + Number(r.std_drinks ?? 1), 0)
  const weeks = length / 7

  const days = dailySeries(current, afDays, from, today)
  const perWeek = round1(sum(current) / weeks)
  const prevPerWeek = round1(sum(previous) / weeks)
  // Only compare when the earlier period was tracked for at least its second half
  // (someone who started mid-period would otherwise see a big false change).
  const prevStart = previous.reduce((min, r) => (r.day < min ? r.day : min), '9999-12-31')
  const prevTracked = previous.length > 0 && prevStart <= addDays(prevFrom, Math.floor(length / 2))
  const changePct = prevTracked && prevPerWeek > 0 ? Math.round(((perWeek - prevPerWeek) / prevPerWeek) * 100) : null

  return {
    range,
    from,
    to: today,
    days,
    total: round1(sum(current)),
    perWeek,
    prevPerWeek: prevTracked ? prevPerWeek : null,
    changePct,
    afDays: days.filter(d => d.af).length,
    dayCount: length,
    topTrigger: topValue(current, 'trigger'),
    topMood: topValue(current, 'mood'),
  }
}
