// Database service file for Supabase interactions
// All queries respect Row Level Security (RLS) by using authenticated user

import { supabase } from '../supabase' // Import Supabase client

// Function to add a drink log with optional context
// Automatically includes user_id for RLS compliance
export async function addDrinkLog(context) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const insertData = {
    user_id: user.id,
    ...context
  }
  const { data, error } = await supabase
    .from('drink_logs')
    .insert([insertData])
    .select()
  if (error) throw error
  return data
}

// Function to get today's drink count
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

// Function to get historical daily counts
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
  const counts = {}
  data.forEach(log => {
    const date = log.created_at.split('T')[0]
    counts[date] = (counts[date] || 0) + 1
  })
  for (let i = 0; i < days; i++) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    if (!counts[dateStr]) counts[dateStr] = 0
  }
  return counts
}

// Function to get context frequencies
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

// Function to get all drink logs
export async function getAllDrinkLogs() {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Function to add a user-entered trigger
export async function addUserTrigger(triggerText, copingStrategy = null) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const insertData = {
    user_id: user.id,
    trigger_text: triggerText.trim(),
    coping_strategy: copingStrategy ? copingStrategy.trim() : null
  }
  const { error } = await supabase
    .from('user_triggers')
    .insert([insertData])
  if (error) throw error
}

// Function to get user triggers
export async function getUserTriggers() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const { data, error } = await supabase
    .from('user_triggers')
    .select('id, created_at, trigger_text, coping_strategy')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Function to add a user reflection
export async function addUserReflection(reflectionText, exerciseType) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const insertData = {
    user_id: user.id,
    reflection_text: reflectionText.trim(),
    exercise_type: exerciseType
  }
  const { error } = await supabase
    .from('user_reflections')
    .insert([insertData])
  if (error) throw error
}

// Function to get user reflections
export async function getUserReflections() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const { data, error } = await supabase
    .from('user_reflections')
    .select('id, created_at, reflection_text, exercise_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// New function: Log a mindfulness session and return all sessions
export async function logMindfulnessSession() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }
  const today = new Date().toISOString().split('T')[0]
  const insertData = {
    user_id: user.id,
    session_date: today
  }
  const { error } = await supabase
    .from('user_mindfulness_sessions')
    .insert([insertData])
  if (error) throw error
  const { data, error: fetchError } = await supabase
    .from('user_mindfulness_sessions')
    .select('session_date')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
  if (fetchError) throw fetchError
  return data || []
}