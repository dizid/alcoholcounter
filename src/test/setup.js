// Test setup file for Vitest — Firebase Auth + API functions architecture
import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import {
  mockUser,
  mockAuth,
  mockGoogleProvider,
  initializeApp,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  resetFirebaseMocks,
} from './mocks/firebase.js'

// Mock the firebase module (src/firebase.js)
vi.mock('../firebase', () => ({
  app: {},
  auth: mockAuth,
  googleProvider: mockGoogleProvider,
  loginWithGoogle: vi.fn().mockResolvedValue(),
  logout: vi.fn().mockResolvedValue(),
  getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
}))

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp,
}))

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Helper to reset all mocks between tests
export const resetMocks = () => {
  vi.clearAllMocks()
  global.fetch.mockReset()
  resetFirebaseMocks()
}

// Helper to mock successful fetch response
export const mockFetchSuccess = (data) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
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
export { mockUser, mockAuth }

// Vue Test Utils global config — stub Transition so v-if removal is immediate
config.global.stubs = {
  teleport: true,
  Transition: true,
}
