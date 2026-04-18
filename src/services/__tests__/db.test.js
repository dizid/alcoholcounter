// Tests for database service (API-based with Firebase token auth)
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to declare mock before vi.mock hoisting
const { mockGetIdToken } = vi.hoisted(() => ({
  mockGetIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
}))

vi.mock('../../firebase', () => ({
  getIdToken: mockGetIdToken,
}))

import {
  addDrinkLog,
  getTodayDrinkCount,
  getHistoricalCounts,
  getContextFrequencies,
  getMoodCorrelations,
  getRecentDrinkLogs,
  updateDrinkLog,
  deleteDrinkLog,
  addUserTrigger,
  getUserTriggers,
  addUserReflection,
  getUserReflections,
  logMindfulnessSession,
  getWeeklyGoal,
  setWeeklyGoal,
  getWeeklyDrinkCount,
} from '../db.js'

describe('db service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('mock-firebase-token')
    global.fetch = vi.fn()
  })

  // Helper to mock successful API response
  const mockApi = (data) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    })
  }

  // Helper to mock failed API response
  const mockApiError = (status = 500) => {
    global.fetch.mockResolvedValueOnce({ ok: false, status })
  }

  // Helper to verify auth header is sent
  const expectAuthHeader = () => {
    const callArgs = global.fetch.mock.calls[0]
    expect(callArgs[1].headers.Authorization).toBe('Bearer mock-firebase-token')
    expect(callArgs[1].headers['Content-Type']).toBe('application/json')
  }

  describe('addDrinkLog', () => {
    it('should POST to api-drinks with context', async () => {
      const mockRow = { id: 'uuid-1', mood: 'happy' }
      mockApi(mockRow)

      const result = await addDrinkLog({ mood: 'happy', location: 'Home' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-drinks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mood: 'happy', location: 'Home' }),
        })
      )
      expectAuthHeader()
      expect(result).toEqual(mockRow)
    })

    it('should throw on API error', async () => {
      mockApiError(500)
      await expect(addDrinkLog({})).rejects.toThrow('API error 500')
    })

    it('should throw when not authenticated', async () => {
      mockGetIdToken.mockRejectedValueOnce(new Error('Not authenticated'))
      await expect(addDrinkLog({})).rejects.toThrow('Not authenticated')
    })
  })

  describe('getTodayDrinkCount', () => {
    it('should GET api-stats with type=today and return count', async () => {
      mockApi({ count: 5 })

      const result = await getTodayDrinkCount()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=today',
        expect.objectContaining({ headers: expect.any(Object) })
      )
      expect(result).toBe(5)
    })

    it('should return 0 when count is 0', async () => {
      mockApi({ count: 0 })
      const result = await getTodayDrinkCount()
      expect(result).toBe(0)
    })

    it('should throw on API error', async () => {
      mockApiError(401)
      await expect(getTodayDrinkCount()).rejects.toThrow('API error 401')
    })
  })

  describe('getHistoricalCounts', () => {
    it('should GET api-stats with type=historical and default 30 days', async () => {
      const mockData = { 'Jan 15': 2, 'Jan 16': 1 }
      mockApi(mockData)

      const result = await getHistoricalCounts()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=historical&days=30',
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })

    it('should accept custom days parameter', async () => {
      mockApi({})
      await getHistoricalCounts(7)

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=historical&days=7',
        expect.any(Object)
      )
    })
  })

  describe('getContextFrequencies', () => {
    it('should GET api-stats with type=context', async () => {
      const mockData = {
        location: { Home: 5, Bar: 3 },
        company: { Alone: 4 },
        drink_type: { beer: 6 },
        mood: { happy: 3 },
      }
      mockApi(mockData)

      const result = await getContextFrequencies()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=context',
        expect.any(Object)
      )
      expect(result.location.Home).toBe(5)
      expect(result.mood.happy).toBe(3)
    })
  })

  describe('getMoodCorrelations', () => {
    it('should GET api-stats with type=mood', async () => {
      const mockData = {
        happy: { count: 5, percentage: 50 },
        stressed: { count: 3, percentage: 30 },
      }
      mockApi(mockData)

      const result = await getMoodCorrelations()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=mood',
        expect.any(Object)
      )
      expect(result.happy.percentage).toBe(50)
    })
  })

  describe('getRecentDrinkLogs', () => {
    it('should GET api-drinks with limit and offset', async () => {
      const mockData = [
        { id: '1', created_at: '2024-01-15T10:00:00Z', mood: 'happy' },
        { id: '2', created_at: '2024-01-14T10:00:00Z', mood: 'neutral' },
      ]
      mockApi(mockData)

      const result = await getRecentDrinkLogs(10, 5)

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-drinks?limit=10&offset=5',
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })

    it('should use default limit and offset', async () => {
      mockApi([])
      await getRecentDrinkLogs()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-drinks?limit=20&offset=0',
        expect.any(Object)
      )
    })
  })

  describe('updateDrinkLog', () => {
    it('should PUT to api-drinks with id and context', async () => {
      mockApi({ ok: true })

      await updateDrinkLog('uuid-1', { mood: 'neutral' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-drinks',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ id: 'uuid-1', mood: 'neutral' }),
        })
      )
    })
  })

  describe('deleteDrinkLog', () => {
    it('should DELETE from api-drinks with id', async () => {
      mockApi({ ok: true })

      await deleteDrinkLog('uuid-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-drinks',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ id: 'uuid-1' }),
        })
      )
    })
  })

  describe('addUserTrigger', () => {
    it('should POST to api-triggers with text and coping strategy', async () => {
      mockApi({ ok: true })

      await addUserTrigger('stress', 'take a walk')

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-triggers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ trigger_text: 'stress', coping_strategy: 'take a walk' }),
        })
      )
    })

    it('should handle null coping strategy', async () => {
      mockApi({ ok: true })

      await addUserTrigger('boredom')

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-triggers',
        expect.objectContaining({
          body: JSON.stringify({ trigger_text: 'boredom', coping_strategy: null }),
        })
      )
    })
  })

  describe('getUserTriggers', () => {
    it('should GET api-triggers', async () => {
      const mockData = [
        { id: '1', trigger_text: 'stress', coping_strategy: 'breathe' },
      ]
      mockApi(mockData)

      const result = await getUserTriggers()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-triggers',
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('addUserReflection', () => {
    it('should POST to api-reflections', async () => {
      mockApi({ ok: true })

      await addUserReflection('I felt calm today', 'breathing')

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-reflections',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reflection_text: 'I felt calm today', exercise_type: 'breathing' }),
        })
      )
    })
  })

  describe('getUserReflections', () => {
    it('should GET api-reflections', async () => {
      const mockData = [
        { id: '1', reflection_text: 'Good day', exercise_type: 'meditation' },
      ]
      mockApi(mockData)

      const result = await getUserReflections()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-reflections',
        expect.any(Object)
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('logMindfulnessSession', () => {
    it('should POST to api-mindfulness', async () => {
      const mockSessions = [
        { session_date: '2024-01-16' },
        { session_date: '2024-01-15' },
      ]
      mockApi(mockSessions)

      const result = await logMindfulnessSession()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-mindfulness',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(mockSessions)
    })
  })

  describe('getWeeklyGoal', () => {
    it('should GET api-goals and return weekly_limit', async () => {
      mockApi({ weekly_limit: 10 })

      const result = await getWeeklyGoal()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-goals',
        expect.any(Object)
      )
      expect(result).toBe(10)
    })

    it('should return null when no goal set', async () => {
      mockApi({ weekly_limit: null })
      const result = await getWeeklyGoal()
      expect(result).toBeNull()
    })
  })

  describe('setWeeklyGoal', () => {
    it('should PUT to api-goals with weekly_limit', async () => {
      mockApi({ ok: true })

      await setWeeklyGoal(14)

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-goals',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ weekly_limit: 14 }),
        })
      )
    })
  })

  describe('getWeeklyDrinkCount', () => {
    it('should GET api-stats with type=weekly and return count', async () => {
      mockApi({ count: 7 })

      const result = await getWeeklyDrinkCount()

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/api-stats?type=weekly',
        expect.any(Object)
      )
      expect(result).toBe(7)
    })
  })
})
