import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useUserStore } from './stores/user'

// Lazy load views for code splitting
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
