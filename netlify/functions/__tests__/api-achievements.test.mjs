// Tests for api-achievements (T-0636 security pass): only the app's badge ids are
// stored, once per user, and only for a signed-in user.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSql = vi.fn()
vi.mock('../lib/db.mjs', () => ({
  getDb: () => mockSql,
}))

const mockVerify = vi.fn()
vi.mock('../lib/auth.mjs', () => ({
  verifyFirebaseToken: mockVerify,
  json: (body, status = 200) => ({ statusCode: status, body: JSON.stringify(body) }),
  preflight: () => ({ statusCode: 204, body: '' }),
}))

const { handler, ACHIEVEMENT_TYPES } = await import('../api-achievements.mjs')

const post = (body) => ({
  httpMethod: 'POST',
  headers: { authorization: 'Bearer valid-token' },
  body: JSON.stringify(body),
})

// The text of the SQL template a mockSql call received
const sqlText = (call) => call[0].join('?')

describe('api-achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockResolvedValue('user-1')
  })

  it('refuses a request without a valid sign-in', async () => {
    mockVerify.mockResolvedValue(null)
    const res = await handler(post({ achievement_type: 'first_week' }))
    expect(res.statusCode).toBe(401)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('matches the badge ids the app knows', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    // vitest runs from the repo root
    const component = readFileSync(resolve(process.cwd(), 'src/components/Achievements.vue'), 'utf8')
    const appIds = [...component.matchAll(/id: '([a-z_]+)'/g)].map(m => m[1])
    expect([...appIds].sort()).toEqual([...ACHIEVEMENT_TYPES].sort())
  })

  it.each([
    ['an unknown id', { achievement_type: 'hacker' }],
    ['a very long text', { achievement_type: 'x'.repeat(100000) }],
    ['an object', { achievement_type: { a: 1 } }],
    ['nothing', {}],
  ])('refuses %s without touching the database', async (_label, body) => {
    const res = await handler(post(body))
    expect(res.statusCode).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('stores a new badge for the signed-in user only once', async () => {
    mockSql.mockResolvedValueOnce([{ id: 'a1', achievement_type: 'first_week', unlocked_at: '2026-11-21T09:00:00Z' }])
    const res = await handler(post({ achievement_type: 'first_week' }))
    expect(res.statusCode).toBe(201)
    const call = mockSql.mock.calls[0]
    expect(sqlText(call)).toContain('WHERE NOT EXISTS')
    // The user id comes from the token, never from the body
    expect(call.slice(1)).toEqual(['user-1', 'first_week', 'user-1', 'first_week'])
  })

  it('answers OK without a new row when the badge is already stored', async () => {
    mockSql.mockResolvedValueOnce([])
    const res = await handler(post({ achievement_type: 'first_week' }))
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, already: true })
  })

  it('lists only the signed-in user\'s badges', async () => {
    mockSql.mockResolvedValueOnce([])
    const res = await handler({ httpMethod: 'GET', headers: {}, body: null })
    expect(res.statusCode).toBe(200)
    expect(mockSql.mock.calls[0].slice(1)).toEqual(['user-1'])
  })
})
