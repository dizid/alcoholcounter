import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useUserStore } from './stores/user'

// Lazy load views for code splitting
// T-0588: Today / Log / Insights / Me replace the old tracker and dashboard pages.
const TodayView = () => import('./views/TodayView.vue')
const LogView = () => import('./views/LogView.vue')
const InsightsView = () => import('./views/InsightsView.vue')
const MeView = () => import('./views/MeView.vue')
const Feedback = () => import('./views/Feedback.vue')
const Login = () => import('./views/Login.vue')
const AboutTracker = () => import('./views/AboutTracker.vue')

const routes = [
  { path: '/', component: TodayView, meta: { requiresAuth: true } },
  { path: '/log', component: LogView, meta: { requiresAuth: true } },
  { path: '/insights', component: InsightsView, meta: { requiresAuth: true } },
  { path: '/me', component: MeView, meta: { requiresAuth: true } },
  // Old address of the dashboard (bookmarks)
  { path: '/dashboard', redirect: '/insights' },
  { path: '/feedback', component: Feedback, meta: { requiresAuth: true } },
  { path: '/about-tracker', component: AboutTracker, meta: { requiresAuth: true } },
  { path: '/login', component: Login, meta: { requiresAuth: false } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Resolves the current Firebase auth state exactly once
function waitForAuth() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Auth guard: redirect to login if not authenticated
router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  const user = await waitForAuth()

  if (!user) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // Keep the Pinia store in sync
  const userStore = useUserStore()
  if (!userStore.user) userStore.setUser(user)

  next()
})

export default router
