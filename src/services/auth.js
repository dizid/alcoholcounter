import { supabase } from '../supabase'

// Login with email and password
export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

// Sign up with email and password
export async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
}

// Login with OAuth provider (e.g., Google)
export async function loginWithProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
  })
  if (error) throw error
}

// Logout and clear session
export async function logout() {
  try {
    // Attempt to sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signOut error:', error.message)
      throw new Error('Failed to log out. Please try again.')
    }
    // Clear any local session data (optional, for robustness)
    await supabase.auth.refreshSession()
  } catch (err) {
    console.error('Logout error:', err.message)
    throw new Error('Logout failed. Please check your connection and try again.')
  }
}