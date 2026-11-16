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
    it('should return the goals and settings without the time-zone history', async () => {
      mockSql.mockResolvedValueOnce([{
        weekly_limit: 10, daily_limit: 3, af_days_goal: 3,
        settings: { coachOn: true, tzHistory: [{ tz: 'Asia/Bangkok', since: '2026-11-16T00:00:00Z' }] },
      }])
      const res = await handler(makeEvent('GET'))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body)).toEqual({ weekly_limit: 10, daily_limit: 3, af_days_goal: 3, settings: { coachOn: true } })
    })

    it('should return nulls when no goal set', async () => {
      mockSql.mockResolvedValueOnce([])
      const res = await handler(makeEvent('GET'))
      expect(JSON.parse(res.body)).toEqual({ weekly_limit: null, daily_limit: null, af_days_goal: null, settings: {} })
    })
  })

  describe('PUT', () => {
    it('should upsert weekly goal', async () => {
      mockSql.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      const res = await handler(makeEvent('PUT', { weekly_limit: 14 }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(res.body).ok).toBe(true)
    })

    it('should keep stored limits that were not sent', async () => {
      mockSql.mockResolvedValueOnce([{ weekly_limit: 14, daily_limit: 3, af_days_goal: 2 }]).mockResolvedValueOnce([])
      await handler(makeEvent('PUT', { daily_limit: 2 }))
      // Second call is the upsert: values are weekly 14, daily 2, af 2
      const upsertValues = mockSql.mock.calls[1].slice(1)
      expect(upsertValues.slice(1, 4)).toEqual([14, 2, 2])
    })

    it('should save valid settings', async () => {
      mockSql.mockResolvedValueOnce([]).mockResolvedValueOnce([])
      const res = await handler(makeEvent('PUT', { settings: { coachOn: false, stdDrinkGrams: 10 } }))
      expect(res.statusCode).toBe(200)
      expect(JSON.parse(mockSql.mock.calls[1][5])).toEqual({ coachOn: false, stdDrinkGrams: 10 })
    })

    it('should refuse bad limits and settings', async () => {
      expect((await handler(makeEvent('PUT', { daily_limit: -1 }))).statusCode).toBe(400)
      expect((await handler(makeEvent('PUT', { daily_limit: 2.5 }))).statusCode).toBe(400)
      expect((await handler(makeEvent('PUT', { af_days_goal: 8 }))).statusCode).toBe(400)
      expect((await handler(makeEvent('PUT', { settings: { coachOn: 'yes' } }))).statusCode).toBe(400)
      expect((await handler(makeEvent('PUT', { settings: { stdDrinkGrams: 99 } }))).statusCode).toBe(400)
      expect((await handler(makeEvent('PUT', { settings: { quickDrinks: [{ type: 'beer', std: 1 }] } }))).statusCode).toBe(400)
      expect(mockSql).not.toHaveBeenCalled()
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
