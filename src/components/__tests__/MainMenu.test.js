// Tests for MainMenu component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MainMenu from '../MainMenu.vue'
import { useUserStore } from '../../stores/user'

// Mock the auth service
vi.mock('../../services/auth', () => ({
  logout: vi.fn().mockResolvedValue(),
}))

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/feedback', name: 'feedback', component: { template: '<div>Feedback</div>' } },
      { path: '/about-tracker', name: 'about', component: { template: '<div>About</div>' } },
    ],
  })
}

describe('MainMenu', () => {
  let router

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createMockRouter()
  })

  const mountMenu = (userLoggedIn = false) => {
    const wrapper = mount(MainMenu, {
      global: {
        plugins: [router],
      },
    })

    if (userLoggedIn) {
      const userStore = useUserStore()
      userStore.setUser({ id: 'user-123', email: 'test@example.com' })
    }

    return wrapper
  }

  describe('rendering', () => {
    it('should render hamburger button', () => {
      const wrapper = mountMenu()

      expect(wrapper.find('.hamburger').exists()).toBe(true)
      expect(wrapper.find('.hamburger-text').text()).toBe('Menu')
    })

    it('should show login link when logged out', () => {
      const wrapper = mountMenu(false)

      expect(wrapper.text()).toContain('Login')
      expect(wrapper.text()).not.toContain('Tracker')
      expect(wrapper.text()).not.toContain('Dashboard')
    })

    it('should show navigation links when logged in', async () => {
      const wrapper = mountMenu(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Tracker')
      expect(wrapper.text()).toContain('Dashboard')
      expect(wrapper.text()).toContain('Feedback')
      expect(wrapper.text()).toContain('Background')
      expect(wrapper.text()).toContain('Logout')
    })
  })

  describe('menu toggle', () => {
    it('should toggle menu open/closed on hamburger click', async () => {
      const wrapper = mountMenu()
      const hamburger = wrapper.find('.hamburger')

      expect(wrapper.find('.nav-links-open').exists()).toBe(false)

      await hamburger.trigger('click')
      expect(wrapper.find('.nav-links-open').exists()).toBe(true)

      await hamburger.trigger('click')
      expect(wrapper.find('.nav-links-open').exists()).toBe(false)
    })

    it('should show X icon when menu is open', async () => {
      const wrapper = mountMenu()

      expect(wrapper.find('.hamburger-icon').text()).toBe('☰')

      await wrapper.find('.hamburger').trigger('click')

      expect(wrapper.find('.hamburger-icon').text()).toBe('✖')
    })
  })

  describe('logout', () => {
    it('should call logout and redirect on logout button click', async () => {
      const { logout } = await import('../../services/auth')
      const wrapper = mountMenu(true)
      await wrapper.vm.$nextTick()

      const logoutButton = wrapper.find('.nav-button')
      await logoutButton.trigger('click')

      expect(logout).toHaveBeenCalled()
    })
  })
})
