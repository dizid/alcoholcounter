// Router configuration with auth guards
import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import MainTracker from './views/MainTracker.vue'
import Dashboard from './views/Dashboard.vue'
import { useUserStore } from './stores/user'

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: MainTracker, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } }
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