// The coach card's text (T-0588). "A thought for today" is written from the
// user's own numbers, without an AI call; the AI only answers when the user
// taps "Ask the coach" (that counts against the daily AI limit).
// Copy rules: never "over limit", "failed" or "broke"; no exclamation marks.

// One short, kind sentence for Today
export function todayThought({ todayStd, dailyLimit, afThisWeek, weekDays, today }) {
  const pastDays = weekDays.filter(d => d.day < today)
  const heaviest = pastDays.reduce((top, d) => (d.std > (top?.std || 0) ? d : top), null)

  if (dailyLimit && todayStd > dailyLimit) {
    return "Today went above your limit. That's okay. A glass of water between drinks makes tomorrow easier."
  }
  if (dailyLimit && todayStd === dailyLimit) {
    return "You're at your limit for today. Something without alcohol for the rest of the evening keeps it there."
  }
  if (todayStd === 0 && afThisWeek >= 2) {
    return `${afThisWeek} alcohol-free days already this week. Each one counts.`
  }
  if (todayStd === 0 && heaviest && heaviest.std > 0) {
    const weekday = new Date(`${heaviest.day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' })
    return `${weekday} was your heaviest day this week. Noticing when it happens is the first step.`
  }
  if (todayStd > 0) {
    return 'Logging as you go keeps the numbers honest. That is the hard part, and you are doing it.'
  }
  return 'A new day. Log drinks as they happen, or tap "Nothing today" tonight.'
}

// Turns the AI's answer into plain paragraphs (no HTML, markdown marks removed)
export function splitAdvice(text) {
  return String(text || '')
    .split(/\n+/)
    .map(line => line.replace(/^#+\s*/, '').replace(/\*\*|__|`/g, '').replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 12)
}
