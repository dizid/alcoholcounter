// Tests for Grok AI service
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The AI endpoint needs the Firebase ID token (T-0586)
const { mockGetIdToken } = vi.hoisted(() => ({
  mockGetIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
}))
vi.mock('../../firebase', () => ({
  getIdToken: mockGetIdToken,
}))

import { getGrokAdvice, getMindfulnessTip } from '../grok.js'

const authedHeaders = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer mock-firebase-token',
}

describe('grok service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('mock-firebase-token')
    global.fetch = vi.fn()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const mockFetch = (data) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    })
  }

  // Error status without a JSON body
  const mockFetchError = (status) => {
    global.fetch.mockResolvedValueOnce({ ok: false, status, json: () => Promise.reject(new Error('no json')) })
  }

  // Error status with the server's JSON message
  const mockFetchErrorBody = (status, body) => {
    global.fetch.mockResolvedValueOnce({ ok: false, status, json: () => Promise.resolve(body) })
  }

  describe('getGrokAdvice', () => {
    it('should fetch advice from grok-proxy', async () => {
      const mockAdvice = 'Consider drinking water between drinks.'
      mockFetch({ advice: mockAdvice })

      const userData = { todayCount: 3, historicalAverage: 2 }
      const result = await getGrokAdvice(userData)

      expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/grok-proxy', {
        method: 'POST',
        headers: authedHeaders,
        body: JSON.stringify({ userData, requestType: 'mainAdvice' }),
      })
      expect(result).toBe(mockAdvice)
    })

    it('should return default message when no advice received', async () => {
      mockFetch({})
      const result = await getGrokAdvice({ todayCount: 0 })
      expect(result).toBe('No advice received.')
    })

    it('should throw on HTTP error', async () => {
      mockFetchError(500)
      await expect(getGrokAdvice({})).rejects.toThrow('HTTP error: 500')
    })

    it('should throw on API error response', async () => {
      mockFetch({ error: 'Rate limit exceeded' })
      await expect(getGrokAdvice({})).rejects.toThrow('Rate limit exceeded')
    })

    it('should throw the server message on a refused call (daily limit)', async () => {
      mockFetchErrorBody(429, { error: "You've used today's 20 AI answers.", reason: 'user_limit' })
      await expect(getGrokAdvice({})).rejects.toThrow("You've used today's 20 AI answers.")
    })

    it('should not call the AI when the user is not signed in', async () => {
      mockGetIdToken.mockRejectedValueOnce(new Error('Not authenticated'))
      await expect(getGrokAdvice({})).rejects.toThrow('Not authenticated')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should throw on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      await expect(getGrokAdvice({})).rejects.toThrow('Network error')
    })
  })

  describe('getMindfulnessTip', () => {
    it('should fetch mindfulness tip from grok-proxy', async () => {
      const mockTip = 'Try focusing on your breath for 5 minutes.'
      mockFetch({ response: mockTip })

      const triggers = ['stress', 'boredom']
      const result = await getMindfulnessTip(triggers)

      expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/grok-proxy', {
        method: 'POST',
        headers: authedHeaders,
        body: JSON.stringify({ userData: { triggers }, requestType: 'mindfulnessTip' }),
      })
      expect(result).toBe(mockTip)
    })

    it('should return default message when no tip received', async () => {
      mockFetch({})
      const result = await getMindfulnessTip([])
      expect(result).toBe('No tip received.')
    })

    it('should throw on HTTP error', async () => {
      mockFetchError(403)
      await expect(getMindfulnessTip([])).rejects.toThrow('HTTP error: 403')
    })

    it('should throw on API error response', async () => {
      mockFetch({ error: 'Service unavailable' })
      await expect(getMindfulnessTip([])).rejects.toThrow('Service unavailable')
    })
  })
})
