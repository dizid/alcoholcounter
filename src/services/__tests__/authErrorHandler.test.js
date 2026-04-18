// Tests for auth error handler
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAuthError } from '../authErrorHandler.js'

describe('authErrorHandler', () => {
  describe('isAuthError', () => {
    it('should detect "not authenticated" error', () => {
      expect(isAuthError(new Error('User not authenticated'))).toBe(true)
    })

    it('should detect "session expired" error', () => {
      expect(isAuthError(new Error('Session expired'))).toBe(true)
    })

    it('should detect "invalid token" error', () => {
      expect(isAuthError(new Error('Invalid token provided'))).toBe(true)
    })

    it('should detect "jwt expired" error', () => {
      expect(isAuthError(new Error('jwt expired'))).toBe(true)
    })

    it('should detect "unauthorized" error', () => {
      expect(isAuthError(new Error('Unauthorized access'))).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(isAuthError(new Error('UNAUTHORIZED'))).toBe(true)
      expect(isAuthError(new Error('JWT EXPIRED'))).toBe(true)
    })

    it('should return false for non-auth errors', () => {
      expect(isAuthError(new Error('Database connection failed'))).toBe(false)
      expect(isAuthError(new Error('Network error'))).toBe(false)
      expect(isAuthError(new Error('Internal server error'))).toBe(false)
    })

    it('should handle null/undefined error', () => {
      expect(isAuthError(null)).toBe(false)
      expect(isAuthError(undefined)).toBe(false)
    })

    it('should handle error without message', () => {
      expect(isAuthError({})).toBe(false)
    })
  })
})
