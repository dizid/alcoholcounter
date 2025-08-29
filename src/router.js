// Router configuration with auth guards
import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import MainTracker from './views/MainTracker.vue'
import Dashboard from './views/Dashboard.vue'
import About from './views/About.vue'
import Feedback from './views/Feedback.vue'
import References from './views/References.vue'
import { useUserStore } from './stores/user'

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: MainTracker, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/about', component: About, meta: { requiresAuth: false } },
  { path: '/feedback', component: Feedback, meta: { requiresAuth: false } },
  { path: '/references', component: References, meta: { requiresAuth: false } }
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