// Mock Supabase client for testing
import { vi } from 'vitest'

// Create chainable query builder mock
export const createQueryBuilder = (data = [], error = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    then: (resolve) => resolve({ data, error }),
  }
  // Make it thenable
  builder[Symbol.toStringTag] = 'Promise'
  return builder
}

// Mock auth state
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

// Create mock Supabase client
export const createMockSupabase = () => {
  const queryBuilder = createQueryBuilder()

  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: mockUser } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue(queryBuilder),
  }
}

// Default mock instance
export const mockSupabase = createMockSupabase()
