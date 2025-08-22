// Database interaction module for drink logs
import { supabase } from '../supabase'

// Add a new drink log (with optional contexts)
// Automatically includes the current user's ID to satisfy RLS policy
export async function addDrinkLog(context) {
  // Fetch current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const insertData = {
    user_id: user.id, // Required for RLS: must match auth.uid()
    ...context // Spread optional contexts (location, company, etc.)
  }

  const { data, error } = await supabase
    .from('drink_logs')
    .insert([insertData])
    .select() // Optionally select to return the inserted row

  if (error) throw error
  return data
}

// Fetch today's drink count (number of logs today)
// RLS automatically filters to user's own logs
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
// RLS automatically filters to user's own logs
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
// RLS automatically filters to user's own logs
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
// RLS automatically limits to user's own logs
export async function resetTodayLogs() {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('drink_logs')
    .delete()
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)
  if (error) throw error
}