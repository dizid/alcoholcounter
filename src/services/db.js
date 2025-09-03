// Database service file for Supabase interactions
// All queries respect Row Level Security (RLS) by using authenticated user

import { supabase } from '../supabase' // Import Supabase client

// Function to add a drink log with optional context
// Automatically includes user_id for RLS compliance
export async function addDrinkLog(context) {
  // Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated') // Throw if no user
  }

  // Prepare insert data with user_id
  const insertData = {
    user_id: user.id, // Required for RLS
    ...context // Spread context fields (location, etc.)
  }

  // Insert into drink_logs table
  const { data, error } = await supabase
    .from('drink_logs')
    .insert([insertData])
    .select() // Return inserted row (optional)

  if (error) throw error // Throw on DB error
  return data // Return inserted data
}

// Function to get today's drink count
// Filtered by date and RLS (user's logs only)
export async function getTodayDrinkCount() {
  const today = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD
  const { data, error } = await supabase
    .from('drink_logs')
    .select('id') // Select IDs for count
    .gte('created_at', `${today}T00:00:00Z`) // Start of day
    .lte('created_at', `${today}T23:59:59Z`) // End of day

  if (error) throw error
  return data.length // Return count
}

// Function to get historical daily counts (default last 30 days)
// Aggregates counts per day, fills zeros for missing dates
export async function getHistoricalCounts(days = 30) {
  const endDate = new Date() // Current date
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days) // Calculate start

  // Query logs in date range (RLS filters to user)
  const { data, error } = await supabase
    .from('drink_logs')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) throw error

  // Aggregate counts by date
  const counts = {}
  data.forEach(log => {
    const date = log.created_at.split('T')[0] // Extract YYYY-MM-DD
    counts[date] = (counts[date] || 0) + 1 // Increment count
  })

  // Fill missing dates with 0 (for consistent chart data)
  for (let i = 0; i < days; i++) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    if (!counts[dateStr]) counts[dateStr] = 0
  }

  return counts // Return date: count object
}

// Function to get frequencies of contexts (location, company, etc.)
// Aggregates from all user's logs (RLS applied)
export async function getContextFrequencies() {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('location, company, drink_type, mood') // Select context fields

  if (error) throw error

  // Initialize frequency object
  const freq = { location: {}, company: {}, drink_type: {}, mood: {} }
  data.forEach(log => {
    // Count each non-null context
    Object.keys(freq).forEach(key => {
      if (log[key]) {
        freq[key][log[key]] = (freq[key][log[key]] || 0) + 1
      }
    })
  })

  return freq // Return frequency object
}

// Function to get all drink logs for the user
// Useful for detailed analysis; sorted by recency
export async function getAllDrinkLogs() {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('*') // Select all fields
    .order('created_at', { ascending: false }) // Newest first

  if (error) throw error
  return data // Return array of logs
}

// Function to add a user-entered trigger to the user_triggers table
// Now includes optional coping_strategy parameter
export async function addUserTrigger(triggerText, copingStrategy = null) {
  // Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated') // Throw if no user
  }

  // Prepare insert data with user_id, trigger_text, and coping_strategy
  const insertData = {
    user_id: user.id, // Required for RLS
    trigger_text: triggerText.trim(), // Trim whitespace for clean data
    coping_strategy: copingStrategy ? copingStrategy.trim() : null // Optional coping strategy
  }

  // Insert into user_triggers table
  const { error } = await supabase
    .from('user_triggers')
    .insert([insertData])

  if (error) throw error // Throw on DB error
}

// Function to get all triggers for the current user
// Includes coping_strategy, sorted by recency
export async function getUserTriggers() {
  // Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated') // Throw if no user
  }

  // Query user's triggers, including coping_strategy
  const { data, error } = await supabase
    .from('user_triggers')
    .select('id, created_at, trigger_text, coping_strategy') // Include coping_strategy
    .eq('user_id', user.id) // Filter by user_id (RLS enforces this)
    .order('created_at', { ascending: false }) // Newest first

  if (error) throw error // Throw on DB error
  return data || [] // Return array of triggers (empty if none)
}

// Note: For performance, consider adding client-side caching (e.g., with localStorage or Pinia) for frequent queries like getTodayDrinkCount if app scales.