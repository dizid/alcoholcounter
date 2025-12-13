// Test setup file for Vitest
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createMockSupabase, mockUser } from './mocks/supabase.js'

// Create fresh mock for each test
const mockSupabase = createMockSupabase()

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}))

// Mock fetch for Netlify functions
global.fetch = vi.fn()

// Helper to reset all mocks between tests
export const resetMocks = () => {
  vi.clearAllMocks()
  global.fetch.mockReset()
}

// Helper to mock successful fetch response
export const mockFetchSuccess = (data) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

// Helper to mock failed fetch response
export const mockFetchError = (status = 500) => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
  })
}

// Export mocks for use in tests
export { mockSupabase, mockUser }

// Vue Test Utils global config
config.global.stubs = {
  teleport: true,
  transition: false,
}
