// Authentication module using Supabase
import { supabase } from '../supabase'

// Sign up with email/password
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

// Login with email/password
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Login with social provider (e.g., Google)
export async function loginWithProvider(provider) { // provider: 'google', etc.
  const { data, error } = await supabase.auth.signInWithOAuth({ provider })
  if (error) throw error
  return data
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}