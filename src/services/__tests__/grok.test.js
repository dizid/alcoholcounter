// Tests for Grok AI service
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGrokAdvice, getMindfulnessTip } from '../grok.js'
import { resetMocks, mockFetchSuccess, mockFetchError } from '../../test/setup.js'

describe('grok service', () => {
  beforeEach(() => {
    resetMocks()
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getGrokAdvice', () => {
    it('should fetch advice from grok-proxy', async () => {
      const mockAdvice = 'Consider drinking water between drinks.'
      mockFetchSuccess({ advice: mockAdvice })

      const userData = { todayCount: 3, historicalAverage: 2 }
      const result = await getGrokAdvice(userData)

      expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/grok-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, requestType: 'mainAdvice' }),
      })
      expect(result).toBe(mockAdvice)
    })

    it('should return default message when no advice received', async () => {
      mockFetchSuccess({})

      const result = await getGrokAdvice({ todayCount: 0 })

      expect(result).toBe('No advice received.')
    })

    it('should throw on HTTP error', async () => {
      mockFetchError(500)

      await expect(getGrokAdvice({})).rejects.toThrow('HTTP error: 500')
    })

    it('should throw on API error response', async () => {
      mockFetchSuccess({ error: 'Rate limit exceeded' })

      await expect(getGrokAdvice({})).rejects.toThrow('Rate limit exceeded')
    })

    it('should throw on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getGrokAdvice({})).rejects.toThrow('Network error')
    })
  })

  describe('getMindfulnessTip', () => {
    it('should fetch mindfulness tip from grok-proxy', async () => {
      const mockTip = 'Try focusing on your breath for 5 minutes.'
      mockFetchSuccess({ response: mockTip })

      const triggers = ['stress', 'boredom']
      const result = await getMindfulnessTip(triggers)

      expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/grok-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData: { triggers }, requestType: 'mindfulnessTip' }),
      })
      expect(result).toBe(mockTip)
    })

    it('should return default message when no tip received', async () => {
      mockFetchSuccess({})

      const result = await getMindfulnessTip([])

      expect(result).toBe('No tip received.')
    })

    it('should throw on HTTP error', async () => {
      mockFetchError(403)

      await expect(getMindfulnessTip([])).rejects.toThrow('HTTP error: 403')
    })

    it('should throw on API error response', async () => {
      mockFetchSuccess({ error: 'Service unavailable' })

      await expect(getMindfulnessTip([])).rejects.toThrow('Service unavailable')
    })
  })
})
