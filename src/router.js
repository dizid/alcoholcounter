import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from './views/LandingPage.vue'
import OnboardingWizard from './views/OnboardingWizard.vue'
import MainTracker from './views/MainTracker.vue'
import Dashboard from './views/Dashboard.vue'
import Feedback from './views/Feedback.vue'
import Login from './views/Login.vue'
import AboutTracker from './views/AboutTracker.vue'
import SubscriptionSettings from './views/SubscriptionSettings.vue'
import { useUserStore } from './stores/user'
import { useSubscriptionStore } from './stores/subscription'

const routes = [
  // Public routes
  { path: '/', component: LandingPage, name: 'landing' },
  { path: '/onboarding', component: OnboardingWizard, name: 'onboarding' },
  { path: '/login', component: Login, name: 'login' },
  { path: '/about-tracker', component: AboutTracker, name: 'about' },

  // Authenticated routes
  {
    path: '/app',
    component: MainTracker,
    name: 'tracker',
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/feedback',
    component: Feedback,
    name: 'feedback',
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription',
    component: SubscriptionSettings,
    name: 'subscription',
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard: redirect to login if not authenticated
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const subscriptionStore = useSubscriptionStore()

  if (to.meta.requiresAuth && !userStore.user) {
    // Not authenticated, redirect to login
    next('/login')
  } else if (to.meta.requiresAuth && userStore.user) {
    // Authenticated, initialize subscription if not already done
    if (!subscriptionStore.subscription) {
      await subscriptionStore.initialize()
    }
    next()
  } else {
    next()
  }
})

export default router