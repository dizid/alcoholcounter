// Database interaction module for drink logs
import { supabase } from '../supabase'

// Add a new drink log (with optional contexts)
export async function addDrinkLog(context) {
  const { data, error } = await supabase
    .from('drink_logs')
    .insert([{ ...context }]) // user_id auto-set by RLS/policy
  if (error) throw error
  return data
}

// Fetch today's drink count (number of logs today)
export async function getTodayDrinkCount() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('drink_logs')
    .select('id')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
  if (error) throw error
  return data.length
}

// Fetch historical daily counts (for graph, last 30 days)
export async function getHistoricalCounts(days = 30) {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('drink_logs')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) throw error

  // Group by date and count
  const counts = {}
  data.forEach(log => {
    const date = log.created_at.split('T')[0]
    counts[date] = (counts[date] || 0) + 1
  })

  // Fill missing dates with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    if (!counts[dateStr]) counts[dateStr] = 0
  }

  return counts
}

// Fetch all contexts for analysis (frequencies)
export async function getContextFrequencies() {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('location, company, drink_type, mood')

  if (error) throw error

  const freq = { location: {}, company: {}, drink_type: {}, mood: {} }
  data.forEach(log => {
    Object.keys(freq).forEach(key => {
      if (log[key]) {
        freq[key][log[key]] = (freq[key][log[key]] || 0) + 1
      }
    })
  })

  return freq
}

// Reset daily count (delete today's logs)
export async function resetTodayLogs() {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('drink_logs')
    .delete()
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
  if (error) throw error
}