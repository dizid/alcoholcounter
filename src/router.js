import { createRouter, createWebHistory } from 'vue-router'
import MainTracker from './views/MainTracker.vue'
import Dashboard from './views/Dashboard.vue'
import Feedback from './views/Feedback.vue'
import Login from './views/Login.vue'
import AboutTracker from './views/AboutTracker.vue' // New import for AboutTracker page
import { useUserStore } from './stores/user'

const routes = [
  { path: '/', component: MainTracker },
  { path: '/dashboard', component: Dashboard },
  { path: '/feedback', component: Feedback },
  { path: '/about-tracker', component: AboutTracker }, // New route for AboutTracker
  { path: '/login', component: Login },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard: redirect to login if not authenticated
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.user) {
    next('/login')
  } else {
    next()
  }
})

export default router