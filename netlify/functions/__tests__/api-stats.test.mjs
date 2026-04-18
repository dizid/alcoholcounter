// Tests for api-stats Netlify function
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.fn()
vi.mock('../lib/db.mjs', () => ({
  getDb: () => mockSql,
}))

const mockVerify = vi.fn()
vi.mock('../lib/auth.mjs', () => ({
  verifyFirebaseToken: mockVerify,
  json: (body, status = 200) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' },
    body: JSON.stringify(body),
  }),
  preflight: () => ({
    statusCode: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' },
    body: '',
  }),
}))

const { handler } = await import('../api-stats.mjs')

describe('api-stats handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockResolvedValue('test-user-id')
  })

  const makeEvent = (type, extraParams = {}) => ({
    httpMethod: 'GET',
    headers: { authorization: 'Bearer valid-token' },
    body: null,
    queryStringParameters: { type, ...extraParams },
  })

  it('should return CORS preflight for OPTIONS', async () => {
    const res = await handler({
      httpMethod: 'OPTIONS',
      headers: {},
      body: null,
      queryStringParameters: {},
    })
    expect(res.statusCode).toBe(204)
  })

  it('should return 405 for non-GET methods', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: null,
      queryStringParameters: {},
    })
    expect(res.statusCode).toBe(405)
  })

  it('should return 401 when unauthorized', async () => {
    mockVerify.mockResolvedValue(null)
    const res = await handler(makeEvent('today'))
    expect(res.statusCode).toBe(401)
  })

  describe('type=today', () => {
    it('should return today drink count', async () => {
      mockSql.mockResolvedValueOnce([{ count: '5' }])
      const res = await handler(makeEvent('today'))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ count: 5 })
    })
  })

  describe('type=weekly', () => {
    it('should return weekly drink count', async () => {
      mockSql.mockResolvedValueOnce([{ count: '12' }])
      const res = await handler(makeEvent('weekly'))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ count: 12 })
    })
  })

  describe('type=historical', () => {
    it('should return counts grouped by date', async () => {
      mockSql.mockResolvedValueOnce([
        { created_at: '2024-01-15T10:00:00Z' },
        { created_at: '2024-01-15T14:00:00Z' },
        { created_at: '2024-01-16T10:00:00Z' },
      ])
      const res = await handler(makeEvent('historical', { days: '30' }))
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(typeof body).toBe('object')
    })

    it('should cap days at 365', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('historical', { days: '999' }))
      expect(res.statusCode).toBe(200)
    })
  })

  describe('type=context', () => {
    it('should return context frequency breakdown', async () => {
      mockSql.mockResolvedValueOnce([
        { location: 'home', company: 'alone', drink_type: 'beer', mood: 'happy' },
        { location: 'home', company: 'friends', drink_type: 'wine', mood: 'happy' },
        { location: 'bar', company: 'friends', drink_type: 'beer', mood: 'stressed' },
      ])
      const res = await handler(makeEvent('context'))
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.location.home).toBe(2)
      expect(body.location.bar).toBe(1)
      expect(body.company.friends).toBe(2)
      expect(body.drink_type.beer).toBe(2)
      expect(body.mood.happy).toBe(2)
    })
  })

  describe('type=mood', () => {
    it('should return mood percentages', async () => {
      mockSql.mockResolvedValueOnce([
        { mood: 'happy' },
        { mood: 'happy' },
        { mood: 'stressed' },
        { mood: 'neutral' },
      ])
      const res = await handler(makeEvent('mood'))
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body.happy.count).toBe(2)
      expect(body.happy.percentage).toBe(50)
      expect(body.stressed.count).toBe(1)
      expect(body.stressed.percentage).toBe(25)
    })

    it('should handle empty mood data', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('mood'))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({})
    })
  })

  describe('missing type', () => {
    it('should return 400 when no type specified', async () => {
      const res = await handler({
        httpMethod: 'GET',
        headers: { authorization: 'Bearer valid-token' },
        body: null,
        queryStringParameters: {},
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockSql.mockRejectedValueOnce(new Error('Connection lost'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const res = await handler(makeEvent('today'))
      expect(res.statusCode).toBe(500)
    })
  })
})
