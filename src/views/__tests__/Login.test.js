// Tests for Login view
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from '../Login.vue'

// Mock auth service
vi.mock('../../services/auth', () => ({
  login: vi.fn(),
  signUp: vi.fn(),
  loginWithProvider: vi.fn(),
}))

const createMockRouter = (query = {}) => {
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
    it('should render login form', async () => {
      const wrapper = await mountLogin()

      expect(wrapper.find('h1').text()).toBe('Alcohol Support Tracker')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').text()).toBe('Login')
    })

    it('should render signup button', async () => {
      const wrapper = await mountLogin()
      const buttons = wrapper.findAll('button')

      expect(buttons.some(b => b.text() === 'Sign Up')).toBe(true)
    })

    it('should show redirect message when session expired', async () => {
      const wrapper = await mountLogin({
        error: 'session_expired',
        message: 'Your session expired'
      })
      await flushPromises()

      expect(wrapper.find('.warning-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('Your session expired')
    })
  })

  describe('login', () => {
    it('should call login with email and password', async () => {
      const { login } = await import('../../services/auth')
      login.mockResolvedValue()

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(login).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should display error on login failure', async () => {
      const { login } = await import('../../services/auth')
      login.mockRejectedValue(new Error('Invalid credentials'))

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('wrong')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('.error').text()).toBe('Invalid credentials')
    })

    it('should disable buttons while loading', async () => {
      const { login } = await import('../../services/auth')
      login.mockImplementation(() => new Promise(() => {})) // Never resolves

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('signup', () => {
    it('should call signUp with email and password', async () => {
      const { signUp } = await import('../../services/auth')
      signUp.mockResolvedValue()

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('new@example.com')
      await wrapper.find('input[type="password"]').setValue('newpassword')

      const signUpButton = wrapper.findAll('button').find(b => b.text() === 'Sign Up')
      await signUpButton.trigger('click')
      await flushPromises()

      expect(signUp).toHaveBeenCalledWith('new@example.com', 'newpassword')
    })

    it('should show success message after signup', async () => {
      const { signUp } = await import('../../services/auth')
      signUp.mockResolvedValue()

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('new@example.com')
      await wrapper.find('input[type="password"]').setValue('newpassword')

      const signUpButton = wrapper.findAll('button').find(b => b.text() === 'Sign Up')
      await signUpButton.trigger('click')
      await flushPromises()

      expect(wrapper.find('.success').text()).toContain('check your email')
    })

    it('should display error on signup failure', async () => {
      const { signUp } = await import('../../services/auth')
      signUp.mockRejectedValue(new Error('Email already exists'))

      const wrapper = await mountLogin()

      await wrapper.find('input[type="email"]').setValue('existing@example.com')
      await wrapper.find('input[type="password"]').setValue('password')

      const signUpButton = wrapper.findAll('button').find(b => b.text() === 'Sign Up')
      await signUpButton.trigger('click')
      await flushPromises()

      expect(wrapper.find('.error').text()).toBe('Email already exists')
    })
  })

  describe('form validation', () => {
    it('should have required email input', async () => {
      const wrapper = await mountLogin()

      expect(wrapper.find('input[type="email"]').attributes('required')).toBeDefined()
    })

    it('should have required password input', async () => {
      const wrapper = await mountLogin()

      expect(wrapper.find('input[type="password"]').attributes('required')).toBeDefined()
    })
  })
})
