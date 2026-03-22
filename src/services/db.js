// Database service — calls Netlify API functions backed by Neon PostgreSQL

import { getIdToken } from '../firebase'

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
