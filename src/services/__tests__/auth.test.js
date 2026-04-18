// Tests for authentication service (Firebase Auth)
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to declare mocks before vi.mock hoisting
const {
  mockLoginWithGoogle,
  mockLogout,
  mockOnAuthStateChanged,
  mockAuthObj,
  mockCurrentUser,
} = vi.hoisted(() => {
  const mockCurrentUser = { uid: 'test-uid', email: 'test@example.com' }
  return {
    mockLoginWithGoogle: vi.fn(),
    mockLogout: vi.fn(),
    mockOnAuthStateChanged: vi.fn(() => vi.fn()),
    mockAuthObj: { currentUser: mockCurrentUser },
    mockCurrentUser,
  }
})

vi.mock('../../firebase', () => ({
  loginWithGoogle: mockLoginWithGoogle,
  logout: mockLogout,
  auth: mockAuthObj,
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
}))

import { loginWithProvider, logout, onAuthChange, getCurrentUser } from '../auth.js'

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoginWithGoogle.mockResolvedValue()
    mockLogout.mockResolvedValue()
    mockAuthObj.currentUser = mockCurrentUser
  })

  describe('loginWithProvider', () => {
    it('should call Firebase loginWithGoogle', async () => {
      await loginWithProvider()
      expect(mockLoginWithGoogle).toHaveBeenCalled()
    })

    it('should propagate errors from Firebase', async () => {
      mockLoginWithGoogle.mockRejectedValueOnce(new Error('Popup closed'))
      await expect(loginWithProvider()).rejects.toThrow('Popup closed')
    })
  })

  describe('logout', () => {
    it('should call Firebase logout', async () => {
      await logout()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('should propagate errors from Firebase', async () => {
      mockLogout.mockRejectedValueOnce(new Error('Network error'))
      await expect(logout()).rejects.toThrow('Network error')
    })
  })

  describe('onAuthChange', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn()
      onAuthChange(callback)
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuthObj, callback)
    })

    it('should return unsubscribe function', () => {
      const unsub = vi.fn()
      mockOnAuthStateChanged.mockReturnValueOnce(unsub)
      const result = onAuthChange(vi.fn())
      expect(result).toBe(unsub)
    })
  })

  describe('getCurrentUser', () => {
    it('should return auth.currentUser', () => {
      const user = getCurrentUser()
      expect(user).toBe(mockCurrentUser)
    })

    it('should return null when no user', () => {
      mockAuthObj.currentUser = null
      const user = getCurrentUser()
      expect(user).toBeNull()
    })
  })
})
