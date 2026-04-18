// Tests for api-goals Netlify function
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

const { handler } = await import('../api-goals.mjs')

describe('api-goals handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockResolvedValue('test-user-id')
  })

  const makeEvent = (method, body = null) => ({
    httpMethod: method,
    headers: { authorization: 'Bearer valid-token' },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: {},
  })

  it('should return CORS preflight for OPTIONS', async () => {
    const res = await handler(makeEvent('OPTIONS'))
    expect(res.statusCode).toBe(204)
  })

  it('should return 401 when unauthorized', async () => {
    mockVerify.mockResolvedValue(null)
    const res = await handler(makeEvent('GET'))
    expect(res.statusCode).toBe(401)
  })

  describe('GET', () => {
    it('should return weekly_limit when goal exists', async () => {
      mockSql.mockResolvedValueOnce([{ weekly_limit: 10 }])
      const res = await handler(makeEvent('GET'))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ weekly_limit: 10 })
    })

    it('should return null when no goal set', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('GET'))
      expect(JSON.parse(res.body)).toEqual({ weekly_limit: null })
    })
  })

  describe('PUT', () => {
    it('should upsert weekly goal', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('PUT', { weekly_limit: 14 }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).ok).toBe(true)
    })
  })

  it('should return 405 for unsupported methods', async () => {
    const res = await handler(makeEvent('DELETE'))
    expect(res.statusCode).toBe(405)
  })

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handler(makeEvent('GET'))
    expect(res.statusCode).toBe(500)
  })
})
