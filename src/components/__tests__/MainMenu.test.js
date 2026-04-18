// Tests for MainMenu component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MainMenu from '../MainMenu.vue'
import { useUserStore } from '../../stores/user'

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

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
      userStore.setUser({ uid: 'user-123', email: 'test@example.com' })
    }

    return wrapper
  }

  describe('rendering', () => {
    it('should render hamburger button', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.hamburger').exists()).toBe(true)
    })

    it('should render brand name', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.nav-brand-text').text()).toBe('DrinkTracker')
    })

    it('should show login link when logged out', () => {
      const wrapper = mountMenu(false)
      expect(wrapper.text()).toContain('Login')
    })

    it('should show navigation links when logged in', async () => {
      const wrapper = mountMenu(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Track')
      expect(wrapper.text()).toContain('Dashboard')
      expect(wrapper.text()).toContain('About')
      expect(wrapper.text()).toContain('Feedback')
      expect(wrapper.text()).toContain('Logout')
    })
  })

  describe('mobile menu', () => {
    it('should open mobile menu on hamburger click', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.nav-mobile').exists()).toBe(true)
    })

    it('should show overlay when mobile menu opens', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.nav-overlay').exists()).toBe(true)
    })

    it('should close mobile menu when overlay clicked', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.nav-mobile').exists()).toBe(true)

      await wrapper.find('.nav-overlay').trigger('click')
      expect(wrapper.find('.nav-mobile').exists()).toBe(false)
    })

    it('should close menu when close button clicked', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.nav-mobile').exists()).toBe(true)

      await wrapper.find('.nav-close').trigger('click')
      expect(wrapper.find('.nav-mobile').exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have aria-expanded on hamburger', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.hamburger').attributes('aria-expanded')).toBe('false')
    })

    it('should update aria-expanded when menu opens', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.hamburger').attributes('aria-expanded')).toBe('true')
    })

    it('should have aria-controls pointing to menu', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.hamburger').attributes('aria-controls')).toBe('main-nav')
    })

    it('should have aria-label on hamburger button', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.hamburger').attributes('aria-label')).toBe('Toggle navigation menu')
    })

    it('should have role="menubar" on desktop nav', () => {
      const wrapper = mountMenu()
      expect(wrapper.find('.nav-desktop').attributes('role')).toBe('menubar')
    })

    it('should have role="menu" on mobile nav', async () => {
      const wrapper = mountMenu()
      await wrapper.find('.hamburger').trigger('click')
      expect(wrapper.find('.nav-mobile').attributes('role')).toBe('menu')
    })
  })

  describe('logout', () => {
    it('should call logout on logout button click', async () => {
      const { logout } = await import('../../services/auth')
      const wrapper = mountMenu(true)
      await wrapper.vm.$nextTick()

      const logoutButton = wrapper.find('.nav-button')
      await logoutButton.trigger('click')

      expect(logout).toHaveBeenCalled()
    })
  })
})
