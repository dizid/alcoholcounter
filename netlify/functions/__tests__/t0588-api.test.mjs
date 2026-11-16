// Tests for the T-0588 API additions: drink fields, local days, alcohol-free days, stats.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSql = vi.fn()
vi.mock('../lib/db.mjs', () => ({ getDb: () => mockSql }))

const mockVerify = vi.fn()
vi.mock('../lib/auth.mjs', () => ({
  verifyFirebaseToken: mockVerify,
  json: (body, status = 200) => ({ statusCode: status, headers: {}, body: JSON.stringify(body) }),
  preflight: () => ({ statusCode: 204, headers: {}, body: '' }),
}))

const drinks = await import('../api-drinks.mjs')
const afDays = await import('../api-af-days.mjs')
const stats = await import('../api-stats.mjs')
const { dailySeries, insightsSummary, topValue } = await import('../lib/insights.mjs')

const BANGKOK = { settings: { tzHistory: [{ tz: 'Asia/Bangkok', since: '2026-01-01T00:00:00Z' }] } }

const makeEvent = (method, body = null, params = {}) => ({
  httpMethod: method,
  headers: { authorization: 'Bearer valid-token' },
  body: body ? JSON.stringify(body) : null,
  queryStringParameters: params,
})

beforeEach(() => {
  vi.resetAllMocks()
  mockVerify.mockResolvedValue('user-1')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('api-drinks fields', () => {
  it('validates the new fields', () => {
    const now = new Date('2026-11-16T10:00:00Z')
    expect(drinks.readDrinkFields({ std_drinks: 1.234, size: 'large', trigger: ' Stress ', note: 'x' }, now).values)
      .toEqual({ std_drinks: 1.23, size: 'large', trigger: 'Stress', note: 'x' })
    expect(drinks.readDrinkFields({ std_drinks: 0 }, now).error).toBeTruthy()
    expect(drinks.readDrinkFields({ std_drinks: 21 }, now).error).toBeTruthy()
    expect(drinks.readDrinkFields({ size: 'huge' }, now).error).toBeTruthy()
    expect(drinks.readDrinkFields({ trigger: 5 }, now).error).toBeTruthy()
    expect(drinks.readDrinkFields({ created_at: '2026-11-16T12:00:00Z' }, now).error).toMatch(/future/)
    expect(drinks.readDrinkFields({ created_at: '2026-11-16T08:00:00Z' }, now).values.created_at).toBe('2026-11-16T08:00:00.000Z')
    expect(drinks.readDrinkFields({ note: 'a'.repeat(900) }, now).values.note).toHaveLength(500)
  })

  it('POST saves std_drinks (default 1) and records a new time zone once', async () => {
    mockSql
      .mockResolvedValueOnce([])           // SELECT settings: no history yet
      .mockResolvedValueOnce([])           // upsert tzHistory
      .mockResolvedValueOnce([{ id: 'd1', std_drinks: '1.00' }]) // INSERT
    const res = await drinks.handler(makeEvent('POST', { drink_type: 'beer', tz: 'Asia/Bangkok' }))
    expect(res.statusCode).toBe(201)
    expect(mockSql).toHaveBeenCalledTimes(3)
    const insertValues = mockSql.mock.calls[2].slice(1)
    expect(insertValues).toContain(1)
    expect(insertValues).toContain('beer')
  })

  it('POST refuses bad input without touching the database', async () => {
    const res = await drinks.handler(makeEvent('POST', { std_drinks: -1 }))
    expect(res.statusCode).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('PUT updates only the fields that were sent', async () => {
    mockSql.mockReturnValue(Promise.resolve([]))
    const res = await drinks.handler(makeEvent('PUT', { id: 'd1', std_drinks: 1.8, size: 'large' }))
    expect(res.statusCode).toBe(200)
    // sql(values, keys) helper call for the SET list
    expect(mockSql).toHaveBeenCalledWith({ std_drinks: 1.8, size: 'large' }, ['std_drinks', 'size'])
  })

  it('PUT with nothing to change is refused', async () => {
    const res = await drinks.handler(makeEvent('PUT', { id: 'd1' }))
    expect(res.statusCode).toBe(400)
  })

  it('GET ?from&to returns the drinks of Bangkok local days', async () => {
    mockSql
      .mockResolvedValueOnce([BANGKOK])
      .mockResolvedValueOnce([
        { id: 'a', created_at: '2026-11-15T17:15:00Z', std_drinks: '1.00' }, // 00:15 Nov 16 in Bangkok
        { id: 'b', created_at: '2026-11-15T16:00:00Z', std_drinks: '1.00' }, // 23:00 Nov 15 in Bangkok
      ])
    const res = await drinks.handler(makeEvent('GET', null, { from: '2026-11-16', to: '2026-11-16', tz: 'Asia/Bangkok' }))
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.map(r => r.id)).toEqual(['a'])
    expect(body[0].day).toBe('2026-11-16')
  })

  it('GET with a bad range is refused', async () => {
    expect((await drinks.handler(makeEvent('GET', null, { from: '2026-11-16', to: '2026-11-01' }))).statusCode).toBe(400)
    expect((await drinks.handler(makeEvent('GET', null, { from: 'x', to: '2026-11-01' }))).statusCode).toBe(400)
  })
})

describe('api-af-days', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T10:00:00Z')) // 17:00 Nov 16 in Bangkok
  })
  afterEach(() => vi.useRealTimers())

  it('marks today alcohol-free when nothing is logged', async () => {
    mockSql
      .mockResolvedValueOnce([BANGKOK]) // settings
      .mockResolvedValueOnce([])        // drinks that day
      .mockResolvedValueOnce([])        // insert
    const res = await afDays.handler(makeEvent('POST', { day: '2026-11-16', tz: 'Asia/Bangkok' }))
    expect(res.statusCode).toBe(201)
    expect(mockSql).toHaveBeenCalledTimes(3)
  })

  it('refuses a day that has drinks', async () => {
    mockSql
      .mockResolvedValueOnce([BANGKOK])
      .mockResolvedValueOnce([{ created_at: '2026-11-16T05:00:00Z' }]) // noon in Bangkok
    const res = await afDays.handler(makeEvent('POST', { day: '2026-11-16', tz: 'Asia/Bangkok' }))
    expect(res.statusCode).toBe(409)
    expect(mockSql).toHaveBeenCalledTimes(2)
  })

  it('refuses future and old days', async () => {
    mockSql.mockResolvedValue([BANGKOK])
    expect((await afDays.handler(makeEvent('POST', { day: '2026-11-17', tz: 'Asia/Bangkok' }))).statusCode).toBe(400)
    expect((await afDays.handler(makeEvent('POST', { day: '2026-10-01', tz: 'Asia/Bangkok' }))).statusCode).toBe(400)
    expect((await afDays.handler(makeEvent('POST', { day: 'today' }))).statusCode).toBe(400)
  })

  it('lists and unmarks days', async () => {
    mockSql.mockResolvedValueOnce([{ day: '2026-11-14' }, { day: '2026-11-16' }])
    const list = await afDays.handler(makeEvent('GET', null, { from: '2026-11-10', to: '2026-11-16' }))
    expect(JSON.parse(list.body)).toEqual(['2026-11-14', '2026-11-16'])
    mockSql.mockResolvedValueOnce([])
    const del = await afDays.handler(makeEvent('DELETE', { day: '2026-11-16' }))
    expect(del.statusCode).toBe(200)
  })
})

describe('api-stats days and insights', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T10:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('type=days gives the last 7 local days with standard drinks and alcohol-free marks', async () => {
    mockSql
      .mockResolvedValueOnce([BANGKOK])
      .mockResolvedValueOnce([
        { created_at: '2026-11-15T17:15:00Z', std_drinks: '1.80' }, // Nov 16 Bangkok
        { created_at: '2026-11-15T12:00:00Z', std_drinks: '1.00' }, // Nov 15 Bangkok
      ])
      .mockResolvedValueOnce([{ day: '2026-11-14' }, { day: '2026-11-15' }])
    const res = await stats.handler(makeEvent('GET', null, { type: 'days', tz: 'Asia/Bangkok' }))
    const body = JSON.parse(res.body)
    expect(body.today).toBe('2026-11-16')
    expect(body.days).toHaveLength(7)
    expect(body.days[0].day).toBe('2026-11-10')
    expect(body.days[6]).toEqual({ day: '2026-11-16', std: 1.8, count: 1, af: false })
    expect(body.days[5]).toEqual({ day: '2026-11-15', std: 1, count: 1, af: false }) // marked but has a drink
    expect(body.days[4]).toEqual({ day: '2026-11-14', std: 0, count: 0, af: true })
  })

  it('type=insights refuses an unknown range', async () => {
    const res = await stats.handler(makeEvent('GET', null, { type: 'insights', range: 'decade' }))
    expect(res.statusCode).toBe(400)
  })
})

describe('insights lib', () => {
  it('dailySeries fills empty days', () => {
    const days = dailySeries([{ day: '2026-11-02', std_drinks: '2.5' }], ['2026-11-01'], '2026-11-01', '2026-11-03')
    expect(days).toEqual([
      { day: '2026-11-01', std: 0, count: 0, af: true },
      { day: '2026-11-02', std: 2.5, count: 1, af: false },
      { day: '2026-11-03', std: 0, count: 0, af: false },
    ])
  })

  it('topValue finds the most frequent trigger with its share', () => {
    expect(topValue([{ trigger: 'Stress' }, { trigger: 'Stress' }, { trigger: 'Social' }, {}], 'trigger'))
      .toEqual({ name: 'Stress', count: 2, pct: 67 })
    expect(topValue([{}], 'mood')).toBeNull()
  })

  it('insightsSummary compares per-week drinks with the period before', () => {
    const rows = [
      { day: '2026-11-16', std_drinks: '7' },   // this week
      { day: '2026-11-04', std_drinks: '14' },  // week before (tracked from its start)
    ]
    const summary = insightsSummary(rows, ['2026-11-15'], '2026-11-16', 'week')
    expect(summary.from).toBe('2026-11-10')
    expect(summary.perWeek).toBe(7)
    expect(summary.prevPerWeek).toBe(14)
    expect(summary.changePct).toBe(-50)
    expect(summary.afDays).toBe(1)
    expect(summary.days).toHaveLength(7)
  })

  it('insightsSummary has no change when there is no earlier data', () => {
    const summary = insightsSummary([{ day: '2026-11-16', std_drinks: '1' }], [], '2026-11-16', 'month')
    expect(summary.changePct).toBeNull()
    expect(summary.prevPerWeek).toBeNull()
    expect(summary.days).toHaveLength(30)
  })
})

describe('insights comparison only with a tracked earlier period', () => {
  it('no change when tracking started late in the earlier period', () => {
    const rows = [
      { day: '2026-11-16', std_drinks: '7' },
      { day: '2026-11-08', std_drinks: '1' }, // only the last day of the week before
    ]
    const summary = insightsSummary(rows, [], '2026-11-16', 'week')
    expect(summary.changePct).toBeNull()
    expect(summary.prevPerWeek).toBeNull()
  })
})
