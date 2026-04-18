// Mock Firebase module for testing
import { vi } from 'vitest'

export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
}

export const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: vi.fn((callback) => {
    // Return unsubscribe function
    return vi.fn()
  }),
}

export const mockGoogleProvider = {}

// Firebase app/auth functions
export const initializeApp = vi.fn().mockReturnValue({})
export const getAuth = vi.fn().mockReturnValue(mockAuth)
export const GoogleAuthProvider = vi.fn().mockReturnValue(mockGoogleProvider)
export const signInWithPopup = vi.fn().mockResolvedValue({ user: mockUser })
export const signOut = vi.fn().mockResolvedValue()
export const onAuthStateChanged = vi.fn((auth, callback) => vi.fn())

// Reset all mocks to fresh state
export function resetFirebaseMocks() {
  mockUser.getIdToken.mockResolvedValue('mock-firebase-token')
  mockAuth.currentUser = mockUser
  signInWithPopup.mockResolvedValue({ user: mockUser })
  signOut.mockResolvedValue()
}
