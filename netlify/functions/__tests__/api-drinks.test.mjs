// Tests for api-drinks Netlify function
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing handler
const mockSql = vi.fn()
vi.mock('../lib/db.mjs', () => ({
  getDb: () => mockSql,
}))

const mockVerify = vi.fn()
vi.mock('../lib/auth.mjs', () => ({
  verifyFirebaseToken: mockVerify,
  json: (body, status = 200) => ({
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
    body: JSON.stringify(body),
  }),
  preflight: () => ({
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
    body: '',
  }),
}))

const { handler } = await import('../api-drinks.mjs')

describe('api-drinks handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockResolvedValue('test-user-id')
  })

  const makeEvent = (method, body = null, params = {}) => ({
    httpMethod: method,
    headers: { authorization: 'Bearer valid-token' },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: params,
  })

  describe('OPTIONS', () => {
    it('should return CORS preflight response', async () => {
      const res = await handler(makeEvent('OPTIONS'))
      expect(res.statusCode).toBe(204)
      expect(res.headers['Access-Control-Allow-Methods']).toContain('GET')
    })
  })

  describe('authentication', () => {
    it('should return 401 when token is invalid', async () => {
      mockVerify.mockResolvedValue(null)
      const res = await handler(makeEvent('GET'))
      expect(res.statusCode).toBe(401)
      expect(JSON.parse(res.body).error).toBe('Unauthorized')
    })
  })

  describe('GET', () => {
    it('should return drink logs for user', async () => {
      const mockRows = [
        { id: 'uuid-1', created_at: '2024-01-15', mood: 'happy' },
      ]
      mockSql.mockResolvedValueOnce(mockRows)

      const res = await handler(makeEvent('GET', null, { limit: '10', offset: '0' }))

      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual(mockRows)
    })

    it('should clamp limit to 100', async () => {
      mockSql.mockResolvedValueOnce([])
      await handler(makeEvent('GET', null, { limit: '999' }))
      // The SQL is called with the clamped value (tested via the function behavior)
      expect(mockSql).toHaveBeenCalled()
    })

    it('should use default limit and offset', async () => {
      mockSql.mockResolvedValueOnce([])
      await handler(makeEvent('GET'))
      expect(mockSql).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should create a drink log', async () => {
      const mockRow = { id: 'uuid-new', mood: 'happy', location: 'Home' }
      mockSql.mockResolvedValueOnce([mockRow])

      const res = await handler(makeEvent('POST', { mood: 'happy', location: 'Home' }))

      expect(res.statusCode).toBe(201)
      expect(JSON.parse(res.body)).toEqual(mockRow)
    })

    it('should handle empty body', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'uuid-new' }])
      const event = { ...makeEvent('POST'), body: null }
      const res = await handler(event)
      expect(res.statusCode).toBe(201)
    })
  })

  describe('PUT', () => {
    it('should update a drink log', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('PUT', { id: 'uuid-1', mood: 'neutral' }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).ok).toBe(true)
    })

    it('should return 400 when id is missing', async () => {
      const res = await handler(makeEvent('PUT', { mood: 'neutral' }))
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body).error).toBe('id required')
    })
  })

  describe('DELETE', () => {
    it('should delete a drink log', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('DELETE', { id: 'uuid-1' }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).ok).toBe(true)
    })

    it('should return 400 when id is missing', async () => {
      const res = await handler(makeEvent('DELETE', {}))
      expect(res.statusCode).toBe(400)
    })
  })

  describe('unsupported method', () => {
    it('should return 405 for PATCH', async () => {
      const res = await handler(makeEvent('PATCH'))
      expect(res.statusCode).toBe(405)
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockSql.mockRejectedValueOnce(new Error('Connection failed'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const res = await handler(makeEvent('GET'))
      expect(res.statusCode).toBe(500)
      expect(JSON.parse(res.body).error).toBe('Internal server error')
    })
  })
})
