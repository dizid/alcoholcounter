// Tests for authentication service
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, signUp, loginWithProvider, logout } from '../auth.js'
import { mockSupabase, resetMocks } from '../../test/setup.js'

describe('auth service', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('login', () => {
    it('should call signInWithPassword with email and password', async () => {
      await login('test@example.com', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should throw error on auth failure', async () => {
      const authError = new Error('Invalid credentials')
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ error: authError })

      await expect(login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('should call signUp with email and password', async () => {
      await signUp('new@example.com', 'newpassword')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
      })
    })

    it('should throw error on signup failure', async () => {
      const signupError = new Error('Email already exists')
      mockSupabase.auth.signUp.mockResolvedValueOnce({ error: signupError })

      await expect(signUp('existing@example.com', 'password')).rejects.toThrow('Email already exists')
    })
  })

  describe('loginWithProvider', () => {
    it('should call signInWithOAuth with provider', async () => {
      await loginWithProvider('google')

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
      })
    })

    it('should throw error on OAuth failure', async () => {
      const oauthError = new Error('OAuth failed')
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: oauthError })

      await expect(loginWithProvider('google')).rejects.toThrow('OAuth failed')
    })
  })

  describe('logout', () => {
    it('should call signOut', async () => {
      await logout()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error on logout failure', async () => {
      const logoutError = { message: 'Network error' }
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: logoutError })

      await expect(logout()).rejects.toThrow('Failed to log out. Please try again.')
    })
  })
})
