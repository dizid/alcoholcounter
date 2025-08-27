// Authentication service file for Supabase auth operations

import { supabase } from '../supabase' // Import Supabase client

// Function for email/password login
export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error // Throw on auth error
}

// Function for email/password signup (with email confirmation)
export async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
}

// Function for OAuth provider login (e.g., Google)
export async function loginWithProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
  })
  if (error) throw error
}

// Function for logout
export async function logout() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signOut error:', error.message)
      throw new Error('Failed to log out. Please try again.')
    }
    // Refresh session to clear local data
    await supabase.auth.refreshSession()
  } catch (err) {
    console.error('Logout error:', err.message)
    throw new Error('Logout failed. Please check your connection and try again.')
  }
}