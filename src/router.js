import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useUserStore } from './stores/user'
import { applyPageMeta } from './lib/pageMeta'

// Lazy load views for code splitting
// T-0588: Today / Log / Insights / Me replace the old tracker and dashboard pages.
const TodayView = () => import('./views/TodayView.vue')
const LogView = () => import('./views/LogView.vue')
const InsightsView = () => import('./views/InsightsView.vue')
const MeView = () => import('./views/MeView.vue')
const Feedback = () => import('./views/Feedback.vue')
const Login = () => import('./views/Login.vue')
const AboutTracker = () => import('./views/AboutTracker.vue')
const PrivacyView = () => import('./views/PrivacyView.vue')
const NotFoundView = () => import('./views/NotFoundView.vue')

// meta.title / meta.fullTitle / meta.description feed the tab title and search
// snippet (src/lib/pageMeta.js). Only /login and /privacy are public, so only those
// two need a real description; they are also the two pages in public/sitemap.xml.
const routes = [
  { path: '/', component: TodayView, meta: { requiresAuth: true, title: 'Today' } },
  { path: '/log', component: LogView, meta: { requiresAuth: true, title: 'Log' } },
  { path: '/insights', component: InsightsView, meta: { requiresAuth: true, title: 'Insights' } },
  { path: '/me', component: MeView, meta: { requiresAuth: true, title: 'Me' } },
  // Old address of the dashboard (bookmarks)
  { path: '/dashboard', redirect: '/insights' },
  { path: '/feedback', component: Feedback, meta: { requiresAuth: true, title: 'Feedback' } },
  { path: '/about-tracker', component: AboutTracker, meta: { requiresAuth: true, title: 'About' } },
  {
    path: '/login',
    component: Login,
    meta: {
      requiresAuth: false,
      fullTitle: 'DrinkTracker: free app to track your drinking and cut down',
    },
  },
  // Privacy notice (T-0609): open to everyone, linked from sign-in, Me and the consent banner
  {
    path: '/privacy',
    component: PrivacyView,
    meta: {
      requiresAuth: false,
      title: 'Privacy',
      description:
        'What DrinkTracker stores, where it is kept, and what the AI coach and Google Analytics receive (only after you say yes). No ads, nothing sold.',
    },
  },
  // Any other address (T-0636, Nov 21 2026): "Page not found" instead of a blank page.
  // Netlify serves these with HTTP 404 (public/_redirects only lists the routes above).
  // A NEW ROUTE needs a line in public/_redirects too, or a hard refresh on it gives a 404.
  {
    path: '/:pathMatch(.*)*',
    component: NotFoundView,
    meta: { requiresAuth: false, title: 'Page not found', noindex: true },
  },
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

// After every route change: this page's title, description and canonical link
router.afterEach(to => {
  applyPageMeta(to)
})

export default router
