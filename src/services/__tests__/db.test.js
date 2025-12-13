// Tests for database service
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to ensure the mock is available when vi.mock runs
const { mockSupabase, mockUser } = vi.hoisted(() => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn(),
  }

  return { mockSupabase, mockUser }
})

// Mock the supabase module
vi.mock('../../supabase', () => ({
  supabase: mockSupabase,
}))

// Import after mocking
import {
  addDrinkLog,
  getTodayDrinkCount,
  getHistoricalCounts,
  getContextFrequencies,
  getAllDrinkLogs,
  addUserTrigger,
  getUserTriggers,
  addUserReflection,
  getUserReflections,
  logMindfulnessSession,
} from '../db.js'

describe('db service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset getUser to return mockUser by default
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  })

  describe('addDrinkLog', () => {
    it('should add drink log with user_id', async () => {
      const mockData = [{ id: 1, user_id: mockUser.id, mood: 'happy' }]
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      })

      const result = await addDrinkLog({ mood: 'happy' })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('drink_logs')
      expect(result).toEqual(mockData)
    })

    it('should throw error if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      await expect(addDrinkLog({ mood: 'happy' })).rejects.toThrow('User not authenticated')
    })

    it('should throw error on database error', async () => {
      const dbError = new Error('Database error')
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: dbError }),
        }),
      })

      await expect(addDrinkLog({ mood: 'sad' })).rejects.toThrow('Database error')
    })
  })

  describe('getTodayDrinkCount', () => {
    it('should return count of today drinks', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const result = await getTodayDrinkCount()

      expect(result).toBe(3)
      expect(mockSupabase.from).toHaveBeenCalledWith('drink_logs')
    })

    it('should throw error on database failure', async () => {
      const dbError = new Error('Connection failed')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: null, error: dbError }),
          }),
        }),
      })

      await expect(getTodayDrinkCount()).rejects.toThrow('Connection failed')
    })
  })

  describe('getHistoricalCounts', () => {
    it('should return counts by date', async () => {
      const mockData = [
        { created_at: '2024-01-15T10:00:00Z' },
        { created_at: '2024-01-15T14:00:00Z' },
        { created_at: '2024-01-16T10:00:00Z' },
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const result = await getHistoricalCounts(30)

      expect(typeof result).toBe('object')
      expect(mockSupabase.from).toHaveBeenCalledWith('drink_logs')
    })
  })

  describe('getContextFrequencies', () => {
    it('should return frequency counts for each context field', async () => {
      const mockData = [
        { location: 'home', company: 'alone', drink_type: 'beer', mood: 'relaxed' },
        { location: 'home', company: 'friends', drink_type: 'wine', mood: 'happy' },
        { location: 'bar', company: 'friends', drink_type: 'beer', mood: 'happy' },
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      })

      const result = await getContextFrequencies()

      expect(result.location.home).toBe(2)
      expect(result.location.bar).toBe(1)
      expect(result.company.friends).toBe(2)
      expect(result.drink_type.beer).toBe(2)
      expect(result.mood.happy).toBe(2)
    })
  })

  describe('getAllDrinkLogs', () => {
    it('should return all drink logs ordered by date', async () => {
      const mockData = [
        { id: 2, created_at: '2024-01-16T10:00:00Z' },
        { id: 1, created_at: '2024-01-15T10:00:00Z' },
      ]
      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      })

      const result = await getAllDrinkLogs()

      expect(result).toEqual(mockData)
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('addUserTrigger', () => {
    it('should add trigger with user_id', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      })

      await addUserTrigger('stress', 'take a walk')

      expect(mockSupabase.from).toHaveBeenCalledWith('user_triggers')
      expect(insertMock).toHaveBeenCalledWith([{
        user_id: mockUser.id,
        trigger_text: 'stress',
        coping_strategy: 'take a walk',
      }])
    })

    it('should handle null coping strategy', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      })

      await addUserTrigger('boredom')

      expect(insertMock).toHaveBeenCalledWith([{
        user_id: mockUser.id,
        trigger_text: 'boredom',
        coping_strategy: null,
      }])
    })

    it('should throw if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      await expect(addUserTrigger('stress')).rejects.toThrow('User not authenticated')
    })
  })

  describe('getUserTriggers', () => {
    it('should return user triggers', async () => {
      const mockData = [
        { id: 1, trigger_text: 'stress', coping_strategy: 'breathe', created_at: '2024-01-15' },
      ]
      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      })
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      })

      const result = await getUserTriggers()

      expect(result).toEqual(mockData)
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should return empty array when no data', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const result = await getUserTriggers()

      expect(result).toEqual([])
    })
  })

  describe('addUserReflection', () => {
    it('should add reflection with user_id and exercise type', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      })

      await addUserReflection('I felt calm today', 'breathing')

      expect(mockSupabase.from).toHaveBeenCalledWith('user_reflections')
      expect(insertMock).toHaveBeenCalledWith([{
        user_id: mockUser.id,
        reflection_text: 'I felt calm today',
        exercise_type: 'breathing',
      }])
    })
  })

  describe('getUserReflections', () => {
    it('should return user reflections', async () => {
      const mockData = [
        { id: 1, reflection_text: 'Good day', exercise_type: 'meditation', created_at: '2024-01-15' },
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const result = await getUserReflections()

      expect(result).toEqual(mockData)
    })
  })

  describe('logMindfulnessSession', () => {
    it('should log session and return all sessions', async () => {
      const mockSessions = [
        { session_date: '2024-01-16' },
        { session_date: '2024-01-15' },
      ]

      // First call for insert, second call for select
      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
            }),
          }),
        })

      const result = await logMindfulnessSession()

      expect(mockSupabase.from).toHaveBeenCalledWith('user_mindfulness_sessions')
      expect(result).toEqual(mockSessions)
    })
  })
})
