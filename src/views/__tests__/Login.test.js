// Tests for Login view (Google Sign-In only)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '../Login.vue'

// Use vi.hoisted to avoid initialization order issues
const { mockLoginWithProvider, mockPrepareSignIn } = vi.hoisted(() => ({
  mockLoginWithProvider: vi.fn(),
  mockPrepareSignIn: vi.fn(),
}))

vi.mock('../../services/auth', () => ({
  loginWithProvider: mockLoginWithProvider,
  prepareSignIn: mockPrepareSignIn,
}))

// Unmount after each test so no earlier page's pending sign-in warm-up fires later
enableAutoUnmount(afterEach)

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: Login },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  })
}

describe('Login view', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createMockRouter()
    vi.clearAllMocks()
    mockLoginWithProvider.mockResolvedValue()
  })

  const mountLogin = async (query = {}) => {
    await router.push({ path: '/login', query })
    await router.isReady()

    return mount(Login, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('rendering', () => {
    it('should render app title', async () => {
      const wrapper = await mountLogin()
      expect(wrapper.find('h1').text()).toBe('DrinkTracker')
    })

    it('should render Google sign-in button', async () => {
      const wrapper = await mountLogin()
      expect(wrapper.find('.google-button').exists()).toBe(true)
      expect(wrapper.find('.google-button').text()).toContain('Continue with Google')
    })

    it('should not render email/password form', async () => {
      const wrapper = await mountLogin()
      expect(wrapper.find('input[type="email"]').exists()).toBe(false)
      expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    })

    it('should show session expired warning when redirected', async () => {
      const wrapper = await mountLogin({
        error: 'session_expired',
        message: 'Your session expired',
      })
      await flushPromises()

      expect(wrapper.find('.warning-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('Your session expired')
    })

    it('should not show warning by default', async () => {
      const wrapper = await mountLogin()
      expect(wrapper.find('.warning-message').exists()).toBe(false)
    })
  })

  describe('Google login', () => {
    // T-0636: the popup helper loads after the page is drawn, not during mount
    it('should prepare Google sign-in after the page is drawn', async () => {
      vi.useFakeTimers()
      try {
        await mountLogin()
        expect(mockPrepareSignIn).not.toHaveBeenCalled()
        await vi.runAllTimersAsync() // the animation frame, then the timeout
        expect(mockPrepareSignIn).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })

    it('should call loginWithProvider on button click', async () => {
      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(mockLoginWithProvider).toHaveBeenCalled()
    })

    it('should navigate to home after successful login', async () => {
      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should navigate to redirect path if provided', async () => {
      const wrapper = await mountLogin({ redirect: '/dashboard' })
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('should show error on login failure', async () => {
      mockLoginWithProvider.mockRejectedValueOnce(new Error('Popup closed by user'))

      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.find('.error').text()).toContain('Popup closed by user')
    })

    it('should show loading state during login', async () => {
      mockLoginWithProvider.mockImplementation(() => new Promise(() => {}))

      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')

      expect(wrapper.find('.google-button').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.google-button').text()).toContain('Loading')
    })

    it('should re-enable button after login failure', async () => {
      mockLoginWithProvider.mockRejectedValueOnce(new Error('Failed'))

      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.google-button').attributes('disabled')).toBeUndefined()
    })
  })

  describe('accessibility', () => {
    it('should have role="alert" on warning message', async () => {
      const wrapper = await mountLogin({
        error: 'session_expired',
        message: 'Session expired',
      })
      await flushPromises()

      expect(wrapper.find('.warning-message').attributes('role')).toBe('alert')
    })

    it('should have role="alert" on error message', async () => {
      mockLoginWithProvider.mockRejectedValueOnce(new Error('Failed'))

      const wrapper = await mountLogin()
      await wrapper.find('.google-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.error').attributes('role')).toBe('alert')
    })
  })
})
