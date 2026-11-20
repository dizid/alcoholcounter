// Authentication service — Firebase Auth (Google only)

import {
  loginWithGoogle as fbLoginWithGoogle,
  prepareGoogleSignIn,
  logout as fbLogout,
  auth,
} from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Google Sign-In via popup
export async function loginWithProvider() {
  await fbLoginWithGoogle()
}

// Loads Google's popup helper before the user taps (sign-in page only, T-0636)
export function prepareSignIn() {
  prepareGoogleSignIn()
}

// Sign out
export async function logout() {
  await fbLogout()
}

// Subscribe to auth state changes; returns unsubscribe function
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

// Get the currently authenticated user (or null)
export function getCurrentUser() {
  return auth.currentUser
}
