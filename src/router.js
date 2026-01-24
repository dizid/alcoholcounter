import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from './stores/user'
import { supabase } from './supabase'

// Lazy load views for code splitting - each view becomes a separate chunk
const MainTracker = () => import('./views/MainTracker.vue')
const Dashboard = () => import('./views/Dashboard.vue')
const Feedback = () => import('./views/Feedback.vue')
const Login = () => import('./views/Login.vue')
const AboutTracker = () => import('./views/AboutTracker.vue')

const routes = [
  { path: '/', component: MainTracker, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/feedback', component: Feedback, meta: { requiresAuth: true } },
  { path: '/about-tracker', component: AboutTracker, meta: { requiresAuth: true } },
  { path: '/login', component: Login, meta: { requiresAuth: false } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Helper to wrap async operations with timeout
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

// Auth guard: redirect to login if not authenticated
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth) {
    if (!userStore.user) {
      try {
        // No user in store - check if session exists first (with timeout)
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000
        )

        if (session) {
          // Session exists - validate it against server (with timeout)
          try {
            const { data: { user }, error } = await withTimeout(
              supabase.auth.getUser(),
              8000
            )

            if (!error && user) {
              // Valid session - update store and allow through
              userStore.setUser(user)
              next()
              return
            } else {
              // Session invalid/expired - clear it
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
            }
          } catch (validationErr) {
            // On timeout, use cached session user to allow through
            // This prevents blank page on slow mobile networks
            console.warn('User validation timed out, using cached session')
            userStore.setUser(session.user)
            next()
            return
          }
        }
      } catch (err) {
        // On timeout or error, redirect to login
        console.warn('Auth check failed:', err)
      }

      // No valid session - redirect to login
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    next()
  } else {
    next()
  }
})

export default router