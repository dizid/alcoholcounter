// Tests for Dashboard view
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Dashboard from '../Dashboard.vue'

// Use vi.hoisted to create mock class before vi.mock hoisting
const MockChart = vi.hoisted(() => {
  return class MockChart {
    constructor() {
      this.destroy = vi.fn()
    }
  }
})

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: MockChart,
}))

// Mock marked
vi.mock('marked', () => ({
  marked: vi.fn((text) => `<p>${text}</p>`),
}))

// Mock db service
vi.mock('../../services/db', () => ({
  getHistoricalCounts: vi.fn().mockResolvedValue({}),
  getContextFrequencies: vi.fn().mockResolvedValue({ location: {}, company: {}, drink_type: {}, mood: {} }),
  getUserTriggers: vi.fn().mockResolvedValue([]),
  getUserReflections: vi.fn().mockResolvedValue([]),
  getMoodCorrelations: vi.fn().mockResolvedValue({}),
  getRecentDrinkLogs: vi.fn().mockResolvedValue([]),
  deleteDrinkLog: vi.fn().mockResolvedValue(),
  updateDrinkLog: vi.fn().mockResolvedValue(),
  getWeeklyGoal: vi.fn().mockResolvedValue(null),
  getWeeklyDrinkCount: vi.fn().mockResolvedValue(0),
}))

// Mock grok service
vi.mock('../../services/grok', () => ({
  getGrokAdvice: vi.fn().mockResolvedValue('Test advice'),
}))

// Mock auth service
vi.mock('../../services/auth', () => ({
  logout: vi.fn().mockResolvedValue(),
}))

// Mock auth error handler
vi.mock('../../services/authErrorHandler', () => ({
  isAuthError: vi.fn().mockReturnValue(false),
  handleAuthError: vi.fn(),
}))

// Mock Achievements component
vi.mock('../../components/Achievements.vue', () => ({
  default: {
    template: '<div class="achievements-stub"></div>',
    props: ['trackingStreak', 'mindfulnessStreak', 'totalReflections', 'goalsMetCount'],
  },
}))

// Import mocked modules for assertions
import * as dbService from '../../services/db'
import * as grokService from '../../services/grok'
import * as authService from '../../services/auth'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: Dashboard },
    ],
  })
}

describe('Dashboard view', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createMockRouter()
    vi.clearAllMocks()

    // Reset mocks to default behavior
    dbService.getHistoricalCounts.mockResolvedValue({})
    dbService.getContextFrequencies.mockResolvedValue({ location: {}, company: {}, drink_type: {}, mood: {} })
    dbService.getUserTriggers.mockResolvedValue([])
    dbService.getUserReflections.mockResolvedValue([])
    dbService.getMoodCorrelations.mockResolvedValue({})
    dbService.getRecentDrinkLogs.mockResolvedValue([])
    dbService.getWeeklyGoal.mockResolvedValue(null)
    dbService.getWeeklyDrinkCount.mockResolvedValue(0)
    grokService.getGrokAdvice.mockResolvedValue('Test advice')
    authService.logout.mockResolvedValue()

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const mountDashboard = async () => {
    await router.push('/dashboard')
    await router.isReady()

    return mount(Dashboard, {
      global: {
        plugins: [router],
        stubs: {
          'pulse-loader': { template: '<div class="pulse-loader-stub">Loading...</div>' },
        },
      },
    })
  }

  describe('rendering', () => {
    it('should render dashboard title', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('h1').text()).toBe('Progress Dashboard')
    })

    it('should render chart canvas', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('canvas#barChart').exists()).toBe(true)
    })

    it('should render AI advice section', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('h2').text()).toBe('Personalized Insights')
    })

    it('should render navigation button', async () => {
      const wrapper = await mountDashboard()
      const buttons = wrapper.findAll('button')
      expect(buttons.some(b => b.text() === 'Back to Tracker')).toBe(true)
    })
  })

  describe('data loading', () => {
    it('should show loading spinner while fetching data', async () => {
      grokService.getGrokAdvice.mockImplementation(() => new Promise(() => {}))
      const wrapper = await mountDashboard()
      expect(wrapper.find('.pulse-loader-stub').exists()).toBe(true)
    })

    it('should display AI advice after loading', async () => {
      grokService.getGrokAdvice.mockResolvedValue('Drink more water!')
      const wrapper = await mountDashboard()
      await flushPromises()
      expect(wrapper.find('.ai-advice-content').exists()).toBe(true)
    })

    it('should fetch historical counts on mount', async () => {
      await mountDashboard()
      await flushPromises()
      expect(dbService.getHistoricalCounts).toHaveBeenCalledWith(30)
    })

    it('should fetch user triggers on mount', async () => {
      await mountDashboard()
      await flushPromises()
      expect(dbService.getUserTriggers).toHaveBeenCalled()
    })

    it('should fetch weekly goal on mount', async () => {
      await mountDashboard()
      await flushPromises()
      expect(dbService.getWeeklyGoal).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should display error message on API failure', async () => {
      grokService.getGrokAdvice.mockRejectedValue(new Error('API error'))
      const wrapper = await mountDashboard()
      await flushPromises()
      expect(wrapper.find('.error').text()).toContain('API error')
    })

    it('should show retry button on error', async () => {
      grokService.getGrokAdvice.mockRejectedValue(new Error('Network error'))
      const wrapper = await mountDashboard()
      await flushPromises()
      expect(wrapper.findAll('button').some(b => b.text() === 'Retry')).toBe(true)
    })

    it('should retry loading data when retry button clicked', async () => {
      grokService.getGrokAdvice
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('Success!')

      const wrapper = await mountDashboard()
      await flushPromises()

      const retryButton = wrapper.findAll('button').find(b => b.text() === 'Retry')
      await retryButton.trigger('click')
      await flushPromises()

      expect(grokService.getGrokAdvice).toHaveBeenCalledTimes(2)
    })
  })

  describe('navigation', () => {
    it('should navigate to tracker on Back button click', async () => {
      const wrapper = await mountDashboard()
      await flushPromises()

      const backButton = wrapper.findAll('button').find(b => b.text() === 'Back to Tracker')
      await backButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('cleanup', () => {
    it('should not throw on unmount', async () => {
      const wrapper = await mountDashboard()
      await flushPromises()
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })
})
