// Text and grouping for the Insights screen (T-0588), written from the numbers.
// Copy rules: "above your limit", never "over limit" or "failed"; no exclamation marks.
import { formatStd } from './day'

// Days -> one entry per 7 days (oldest first), for the year chart
export function weeklyBuckets(days) {
  const buckets = []
  for (let i = days.length; i > 0; i -= 7) {
    const slice = days.slice(Math.max(0, i - 7), i)
    const std = Math.round(slice.reduce((sum, d) => sum + d.std, 0) * 10) / 10
    buckets.unshift({ day: slice[0].day, std, count: slice.reduce((sum, d) => sum + d.count, 0), af: false })
  }
  return buckets
}

// 1-3 short numbered points for "This month, in short"
export function insightPoints(summary, goals, range) {
  const points = []
  const period = { week: 'week', month: 'month', year: 'year' }[range]
  const drinkDays = summary.days.filter(d => d.count > 0)

  if (drinkDays.length === 0 && summary.afDays === 0) {
    return ['Nothing logged yet for this period. Log drinks as they happen, or tap "Nothing today" on alcohol-free days.']
  }

  if (summary.topTrigger && summary.topTrigger.pct >= 30) {
    const share = summary.topTrigger.pct >= 60 ? 'Most' : summary.topTrigger.pct >= 45 ? 'About half' : 'About a third'
    points.push(`${share} of the drinks you added context to came with "${summary.topTrigger.name.toLowerCase()}".`)
  }

  if (summary.changePct !== null && summary.changePct <= -10) {
    points.push(`You drank ${Math.abs(summary.changePct)}% less per week than the ${period} before.`)
  } else if (summary.changePct !== null && summary.changePct >= 10) {
    points.push(`You drank ${summary.changePct}% more per week than the ${period} before. That's okay, it's useful to know.`)
  }

  if (goals.daily_limit) {
    const aboveDays = drinkDays.filter(d => d.std > goals.daily_limit).length
    if (aboveDays === 0) points.push(`Every day stayed within your limit of ${formatStd(goals.daily_limit)}.`)
    else points.push(`${aboveDays} of ${summary.dayCount} days went above your daily limit.`)
  }

  if (summary.afDays > 0 && points.length < 3) {
    points.push(`${summary.afDays} alcohol-free ${summary.afDays === 1 ? 'day' : 'days'} this ${period}.`)
  }

  return points.slice(0, 3)
}
