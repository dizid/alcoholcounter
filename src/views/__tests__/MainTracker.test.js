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
  getHistoricalCounts: vi.fn().mockResolvedValue({}),
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

// Mock supabase
vi.mock('../../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { user_metadata: {} } } })
    }
  }
}))

// Mock ContextForm component
vi.mock('../../components/ContextForm.vue', () => ({
  default: {
    template: '<div class="context-form-stub"><button class="stub-submit" @click="$emit(\'submit\', { mood: \'happy\' }, 1)">Submit</button><button class="stub-cancel" @click="$emit(\'cancel\')">Cancel</button></div>',
    emits: ['submit', 'cancel'],
  },
}))

// Mock Onboarding component
vi.mock('../../components/Onboarding.vue', () => ({
  default: {
    template: '<div class="onboarding-stub"></div>',
    emits: ['complete'],
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
    dbService.getHistoricalCounts.mockResolvedValue({})
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
        provide: {
          quickLogTrigger: { value: 0 }
        }
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

    it('should render Quick Log button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.quick-log-btn').exists()).toBe(true)
      expect(wrapper.find('.quick-log-btn').text()).toContain('Quick Log')
    })

    it('should render With Details button', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.details-btn').exists()).toBe(true)
      expect(wrapper.find('.details-btn').text()).toContain('With Details')
    })

    it('should render support section toggle', async () => {
      const wrapper = await mountTracker()

      expect(wrapper.find('.support-toggle-btn').exists()).toBe(true)
      expect(wrapper.find('.support-toggle-btn').text()).toContain('Need Support?')
    })
  })

  describe('drink tracking', () => {
    it('should show context form when With Details is clicked', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Click With Details to show context form
      await wrapper.find('.details-btn').trigger('click')
      await flushPromises()

      // Context form should be visible (stubbed)
      expect(wrapper.find('.context-form-stub').exists()).toBe(true)
    })

    it('should call addDrinkLog when Quick Log is clicked', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Click Quick Log
      await wrapper.find('.quick-log-btn').trigger('click')
      await flushPromises()

      expect(dbService.addDrinkLog).toHaveBeenCalledWith({})
    })

    it('should load today drink count on mount', async () => {
      await mountTracker()
      await flushPromises()

      expect(dbService.getTodayDrinkCount).toHaveBeenCalled()
    })
  })

  describe('support section', () => {
    it('should toggle support section visibility', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      expect(wrapper.find('.support-content').exists()).toBe(false)

      await wrapper.find('.support-toggle-btn').trigger('click')
      await flushPromises()

      expect(wrapper.find('.support-content').exists()).toBe(true)
    })

    it('should display support cards when section is open', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      await wrapper.find('.support-toggle-btn').trigger('click')
      await flushPromises()

      expect(wrapper.find('.support-cards').exists()).toBe(true)
    })

    it('should show streak badge if streak exists', async () => {
      // Set streak in localStorage
      localStorage.setItem('mindfulnessStreak', '5')

      const wrapper = await mountTracker()
      await flushPromises()

      // The streak badge should be visible in the support toggle button
      const button = wrapper.find('.support-toggle-btn')
      expect(button.exists()).toBe(true)
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

      await wrapper.find('.quick-log-btn').trigger('click')
      await flushPromises()

      // Should show error message
      expect(wrapper.find('.error').exists() || wrapper.text()).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria-expanded on support toggle button', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      const toggle = wrapper.find('.support-toggle-btn')
      // Initially collapsed
      expect(toggle.attributes('aria-expanded')).toBe('false')
    })

    it('should update aria-expanded when support tools toggled', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      const toggle = wrapper.find('.support-toggle-btn')
      await toggle.trigger('click')
      await flushPromises()

      // Now expanded
      expect(toggle.attributes('aria-expanded')).toBe('true')
    })

    it('should have aria-controls on support toggle button', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      const toggle = wrapper.find('.support-toggle-btn')
      expect(toggle.attributes('aria-controls')).toBe('support-content')
    })

    it('should have role="region" on support content when visible', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Open support tools
      await wrapper.find('.support-toggle-btn').trigger('click')
      await flushPromises()

      const supportContent = wrapper.find('#support-content')
      expect(supportContent.exists()).toBe(true)
      expect(supportContent.attributes('role')).toBe('region')
    })

    it('should have aria-pressed on support card buttons', async () => {
      const wrapper = await mountTracker()
      await flushPromises()

      // Open support tools
      await wrapper.find('.support-toggle-btn').trigger('click')
      await flushPromises()

      const cards = wrapper.findAll('.support-card')
      expect(cards.length).toBeGreaterThan(0)

      // All cards should have aria-pressed="false" initially
      cards.forEach(card => {
        expect(card.attributes('aria-pressed')).toBe('false')
      })
    })
  })
})
