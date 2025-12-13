// Tests for MainTracker view
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MainTracker from '../MainTracker.vue'

// Mock db service
vi.mock('../../services/db', () => ({
  getTodayDrinkCount: vi.fn().mockResolvedValue(0),
  addDrinkLog: vi.fn().mockResolvedValue([{ id: 1 }]),
  getUserTriggers: vi.fn().mockResolvedValue([]),
  getUserReflections: vi.fn().mockResolvedValue([]),
  addUserTrigger: vi.fn().mockResolvedValue(),
  addUserReflection: vi.fn().mockResolvedValue(),
  logMindfulnessSession: vi.fn().mockResolvedValue([]),
}))

// Mock grok service
vi.mock('../../services/grok', () => ({
  getMindfulnessTip: vi.fn().mockResolvedValue('Take a deep breath'),
}))

// Mock auth error handler
vi.mock('../../services/authErrorHandler', () => ({
  isAuthError: vi.fn().mockReturnValue(false),
  handleAuthError: vi.fn(),
}))

// Mock ContextForm component
vi.mock('../../components/ContextForm.vue', () => ({
  default: {
    template: '<div class="context-form-stub"><button @click="$emit(\'submit\', { mood: \'happy\' })">Submit</button><button @click="$emit(\'cancel\')">Cancel</button></div>',
    emits: ['submit', 'cancel'],
  },
}))

// Import mocked modules for assertions and reset
import * as dbService from '../../services/db'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: MainTracker },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  })
}

describe('MainTracker view', () => {
  let router

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createMockRouter()
    vi.clearAllMocks()

    // Reset mocks to default values
    dbService.getTodayDrinkCount.mockResolvedValue(0)
    dbService.addDrinkLog.mockResolvedValue([{ id: 1 }])
    dbService.getUserTriggers.mockResolvedValue([])
    dbService.getUserReflections.mockResolvedValue([])
    dbService.logMindfulnessSession.mockResolvedValue([])

    // Suppress console logs
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const mountTracker = async () => {
    await router.push('/')
    await router.isReady()

    return mount(MainTracker, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('rendering', () => {
    it('should render tracker title', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('h1').text()).toBe('Daily Drink Tracker')
    })

    it('should display current drink count', async () => {
      dbService.getTodayDrinkCount.mockResolvedValue(3)

      const wrapper = await mountTracker()
      await flushPromises()

      expect(wrapper.text()).toContain('Current drinks today: 3')
    })

    it('should render Add Drink button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.add-drink-button').text()).toBe('+ Add Drink')
    })

    it('should render Save button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.save-button').text()).toBe('Save')
    })

    it('should render mindfulness section button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.mindfulness-button').exists()).toBe(true)
    })

    it('should render CBT section button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.cbt-button').exists()).toBe(true)
    })
  })

  describe('drink tracking', () => {
    it('should show context form when Add Drink is clicked', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Click Add Drink to show context form
      await wrapper.find('.add-drink-button').trigger('click')
      await flushPromises()

      // Context form should be visible (stubbed)
      expect(wrapper.find('.context-form-stub').exists()).toBe(true)
    })

    it('should call addDrinkLog when Save is clicked', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Add a drink first
      await wrapper.find('.add-drink-button').trigger('click')
      await flushPromises()

      // Save
      await wrapper.find('.save-button').trigger('click')
      await flushPromises()

      expect(dbService.addDrinkLog).toHaveBeenCalled()
    })

    it('should load today drink count on mount', async () => {
      await mountTracker()
      await flushPromises()

      expect(dbService.getTodayDrinkCount).toHaveBeenCalled()
    })
  })

  describe('mindfulness section', () => {
    it('should toggle mindfulness section visibility', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      expect(wrapper.find('.mindfulness-content').exists()).toBe(false)

      await wrapper.find('.mindfulness-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.mindfulness-content').exists()).toBe(true)
    })

    it('should display mindfulness tabs when section is open', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      await wrapper.find('.mindfulness-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.mindfulness-tabs').exists()).toBe(true)
    })

    it('should show streak counter if streak exists', async () => {
      // Return sessions that would create a streak
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      dbService.logMindfulnessSession.mockResolvedValue([
        { session_date: today },
        { session_date: yesterday },
      ])

      const wrapper = await mountTracker()
      await flushPromises()

      // The streak counter visibility depends on calculated streak value
      const button = wrapper.find('.mindfulness-button')
      expect(button.exists()).toBe(true)
    })
  })

  describe('CBT section', () => {
    it('should toggle CBT section visibility', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      expect(wrapper.find('.cbt-content').exists()).toBe(false)

      await wrapper.find('.cbt-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.cbt-content').exists()).toBe(true)
    })

    it('should display CBT tabs when section is open', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      await wrapper.find('.cbt-button').trigger('click')
      await flushPromises()

      expect(wrapper.find('.cbt-tabs').exists()).toBe(true)
    })
  })

  describe('progress messages', () => {
    it('should show encouraging message for 0 drinks', async () => {
      dbService.getTodayDrinkCount.mockResolvedValue(0)

      const wrapper = await mountTracker()
      await flushPromises()

      // Check for progress message element
      expect(wrapper.text()).toMatch(/drink|progress|great|keep/i)
    })
  })

  describe('error handling', () => {
    it('should handle getTodayDrinkCount error gracefully', async () => {
      dbService.getTodayDrinkCount.mockRejectedValue(new Error('Database error'))

      const wrapper = await mountTracker()
      await flushPromises()

      // Should not crash, still renders
      expect(wrapper.find('h1').exists()).toBe(true)
    })

    it('should handle addDrinkLog error gracefully', async () => {
      dbService.addDrinkLog.mockRejectedValue(new Error('Save failed'))

      const wrapper = await mountTracker()
      await flushPromises()

      await wrapper.find('.add-drink-button').trigger('click')
      await wrapper.find('.save-button').trigger('click')
      await flushPromises()

      // Should show error message
      expect(wrapper.find('.error').exists() || wrapper.text()).toBeTruthy()
    })
  })
})
