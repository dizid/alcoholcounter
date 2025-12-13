import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../supabase'

/**
 * Detects if an error is authentication-related
 */
export function isAuthError(error) {
  const patterns = [
    'not authenticated',
    'session expired',
    'invalid token',
    'jwt expired',
    'unauthorized'
  ]
  const msg = error?.message?.toLowerCase() || ''
  return patterns.some(p => msg.includes(p))
}

/**
 * Handles authentication errors consistently across the app
 * Clears user state and redirects to login
 */
export async function handleAuthError(error, context = '') {
  console.error(`Auth error in ${context}:`, error)

  const userStore = useUserStore()
  const router = useRouter()

  // Clear user state
  userStore.setUser(null)

  // Clean up session
  await supabase.auth.signOut({ scope: 'local' })

  // Redirect to login with context
  router.push({
    path: '/login',
    query: {
      error: 'session_expired',
      message: 'Your session has expired. Please log in again.',
      redirect: router.currentRoute.value.fullPath
    }
  })
}
