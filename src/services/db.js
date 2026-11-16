// Database service — calls Netlify API functions backed by Neon PostgreSQL

import { getIdToken } from '../firebase'
import { deviceTimeZone } from '../lib/day'

// Base fetch helper — attaches Firebase auth token to every request
async function api(path, options = {}) {
  const token = await getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// Add a drink log with optional context
export async function addDrinkLog(context) {
  return api('/.netlify/functions/api-drinks', {
    method: 'POST',
    body: JSON.stringify(context),
  })
}

// Get today's drink count
export async function getTodayDrinkCount() {
  const data = await api('/.netlify/functions/api-stats?type=today')
  return data.count
}

// Get historical daily counts (default 30 days)
export async function getHistoricalCounts(days = 30) {
  return api(`/.netlify/functions/api-stats?type=historical&days=${days}`)
}

// Get context frequencies (location, company, drink_type, mood)
export async function getContextFrequencies() {
  return api('/.netlify/functions/api-stats?type=context')
}

// Get mood correlations with percentages
export async function getMoodCorrelations() {
  return api('/.netlify/functions/api-stats?type=mood')
}

// Get paginated recent drink logs
export async function getRecentDrinkLogs(limit = 20, offset = 0) {
  return api(`/.netlify/functions/api-drinks?limit=${limit}&offset=${offset}`)
}

// Update an existing drink log
export async function updateDrinkLog(id, context) {
  return api('/.netlify/functions/api-drinks', {
    method: 'PUT',
    body: JSON.stringify({ id, ...context }),
  })
}

// Delete a drink log
export async function deleteDrinkLog(id) {
  return api('/.netlify/functions/api-drinks', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  })
}

// Add a user trigger
export async function addUserTrigger(triggerText, copingStrategy = null) {
  return api('/.netlify/functions/api-triggers', {
    method: 'POST',
    body: JSON.stringify({ trigger_text: triggerText, coping_strategy: copingStrategy }),
  })
}

// Get user triggers
export async function getUserTriggers() {
  return api('/.netlify/functions/api-triggers')
}

// Add a user reflection
export async function addUserReflection(reflectionText, exerciseType) {
  return api('/.netlify/functions/api-reflections', {
    method: 'POST',
    body: JSON.stringify({ reflection_text: reflectionText, exercise_type: exerciseType }),
  })
}

// Get user reflections
export async function getUserReflections() {
  return api('/.netlify/functions/api-reflections')
}

// Log today's mindfulness session and return all sessions (for streak calculation)
export async function logMindfulnessSession() {
  return api('/.netlify/functions/api-mindfulness', { method: 'POST' })
}

// Get weekly drink goal
export async function getWeeklyGoal() {
  const data = await api('/.netlify/functions/api-goals')
  return data.weekly_limit
}

// Set weekly drink goal
export async function setWeeklyGoal(weeklyLimit) {
  return api('/.netlify/functions/api-goals', {
    method: 'PUT',
    body: JSON.stringify({ weekly_limit: weeklyLimit }),
  })
}

// Get weekly drink count (last 7 days)
export async function getWeeklyDrinkCount() {
  const data = await api('/.netlify/functions/api-stats?type=weekly')
  return data.count
}

// ---- T-0588 redesign: local days, standard drinks, alcohol-free days ----
// Every day-based call sends the phone's time zone, so days end at local midnight.

const tzParam = () => `tz=${encodeURIComponent(deviceTimeZone())}`

// Logs a drink: { drink_type, std_drinks, size, trigger, mood, note, created_at }
export async function addDrink(drink) {
  return api('/.netlify/functions/api-drinks', {
    method: 'POST',
    body: JSON.stringify({ ...drink, tz: deviceTimeZone() }),
  })
}

// Changes only the fields given
export async function updateDrink(id, fields) {
  return api('/.netlify/functions/api-drinks', {
    method: 'PUT',
    body: JSON.stringify({ id, ...fields }),
  })
}

// Drinks of local days from..to ("YYYY-MM-DD"), newest first, each with `day`
export async function getDrinksBetween(from, to) {
  return api(`/.netlify/functions/api-drinks?from=${from}&to=${to}&${tzParam()}`)
}

// { today, days: [{ day, std, count, af }] } for local days from..to (default: last 7)
export async function getDays(from, to) {
  const range = from && to ? `&from=${from}&to=${to}` : ''
  return api(`/.netlify/functions/api-stats?type=days${range}&${tzParam()}`)
}

// The Insights summary for range week|month|year
export async function getInsights(range) {
  return api(`/.netlify/functions/api-stats?type=insights&range=${range}&${tzParam()}`)
}

// Marks a local day alcohol-free ("Nothing today")
export async function markAlcoholFree(day) {
  return api('/.netlify/functions/api-af-days', {
    method: 'POST',
    body: JSON.stringify({ day, tz: deviceTimeZone() }),
  })
}

// Removes an alcohol-free mark
export async function unmarkAlcoholFree(day) {
  return api('/.netlify/functions/api-af-days', {
    method: 'DELETE',
    body: JSON.stringify({ day }),
  })
}

// { weekly_limit, daily_limit, af_days_goal, settings }
export async function getGoals() {
  return api('/.netlify/functions/api-goals')
}

// Saves only the fields given (limits and/or settings)
export async function saveGoals(fields) {
  return api('/.netlify/functions/api-goals', {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
}
