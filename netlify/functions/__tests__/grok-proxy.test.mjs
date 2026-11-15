// Tests for the grok-proxy Netlify function and its daily caps (T-0586)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockVerify = vi.fn()
vi.mock('../lib/auth.mjs', () => ({
  verifyFirebaseToken: mockVerify,
}))

const mockClaim = vi.fn()
vi.mock('../lib/aiUsage.mjs', async (importOriginal) => {
  const real = await importOriginal()
  return { ...real, claimAiCall: mockClaim }
})

vi.mock('@netlify/blobs', () => ({
  getStore: vi.fn(),
}))

const { default: grokProxy, buildPrompt, MAX_BODY_BYTES } = await import('../grok-proxy.mjs')

// Calls the v2 function and returns { statusCode, body } like the Lambda tests
async function handler(request) {
  const res = await grokProxy(request)
  return { statusCode: res.status, body: await res.text() }
}
const { incrementUnderCap, claimAiCall: realClaimAiCall, PER_USER_DAILY_CAP, GLOBAL_DAILY_CAP } =
  await vi.importActual('../lib/aiUsage.mjs')

const makeEvent = (body, headers = { authorization: 'Bearer valid-token' }) =>
  new Request('https://alcohol.dizid.com/.netlify/functions/grok-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const plainRequest = (method) => new Request('https://alcohol.dizid.com/.netlify/functions/grok-proxy', { method })

const xaiAnswer = (content) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ choices: [{ message: { content } }] }),
})

describe('grok-proxy handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerify.mockResolvedValue('user-1')
    mockClaim.mockResolvedValue('ok')
    process.env.GROK_API_KEY = 'test-key'
    global.fetch = vi.fn().mockResolvedValue(xaiAnswer('Drink water between drinks.'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    delete process.env.GROK_API_KEY
  })

  it('answers OPTIONS preflight', async () => {
    const res = await handler(plainRequest('OPTIONS'))
    expect(res.statusCode).toBe(204)
  })

  it('refuses non-POST methods', async () => {
    const res = await handler(plainRequest('GET'))
    expect(res.statusCode).toBe(405)
  })

  it('refuses anonymous calls without calling xAI or counting', async () => {
    mockVerify.mockResolvedValue(null)
    const res = await handler(makeEvent({ requestType: 'mainAdvice', userData: {} }, {}))
    expect(res.statusCode).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockClaim).not.toHaveBeenCalled()
  })

  it('refuses unknown request types (no free-text prompts)', async () => {
    const res = await handler(makeEvent({ requestType: 'a poem about cats', userData: {} }))
    expect(res.statusCode).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refuses oversized bodies', async () => {
    const big = JSON.stringify({ requestType: 'mainAdvice', userData: { reflections: ['x'.repeat(MAX_BODY_BYTES)] } })
    const res = await handler(makeEvent(big))
    expect(res.statusCode).toBe(413)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refuses invalid JSON', async () => {
    const res = await handler(makeEvent('{not json'))
    expect(res.statusCode).toBe(400)
  })

  it('returns 429 with a plain message when the user hit the daily cap', async () => {
    mockClaim.mockResolvedValue('user_limit')
    const res = await handler(makeEvent({ requestType: 'mainAdvice', userData: {} }))
    expect(res.statusCode).toBe(429)
    expect(JSON.parse(res.body).error).toMatch(/today's 20 AI answers/)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 503 when the counter store is unavailable (fails closed)', async () => {
    mockClaim.mockResolvedValue('unavailable')
    const res = await handler(makeEvent({ requestType: 'mainAdvice', userData: {} }))
    expect(res.statusCode).toBe(503)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns advice for mainAdvice and caps the answer length', async () => {
    const res = await handler(makeEvent({ requestType: 'mainAdvice', userData: { triggers: ['stress'] } }))
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ advice: 'Drink water between drinks.' })
    expect(mockClaim).toHaveBeenCalledWith('user-1')
    expect(mockVerify).toHaveBeenCalledWith({ headers: { authorization: 'Bearer valid-token' } })
    const sent = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(sent.max_tokens).toBeGreaterThan(0)
    expect(sent.messages[0].content).toContain('["stress"]')
  })

  it('returns response for mindfulnessTip', async () => {
    const res = await handler(makeEvent({ requestType: 'mindfulnessTip', userData: { triggers: [] } }))
    expect(JSON.parse(res.body)).toEqual({ response: 'Drink water between drinks.' })
  })

  it('does not pass xAI error text (may echo user data) to logs or the client', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('prompt: secret reflections') })
    const res = await handler(makeEvent({ requestType: 'mainAdvice', userData: {} }))
    expect(res.statusCode).toBe(502)
    expect(res.body).not.toContain('secret')
    for (const call of console.error.mock.calls) expect(call.join(' ')).not.toContain('secret')
  })

  it('never logs the request body', async () => {
    await handler(makeEvent({ requestType: 'mainAdvice', userData: { reflections: ['private note 123'] } }))
    const logged = [...console.log.mock.calls, ...console.error.mock.calls].map((c) => c.join(' ')).join('\n')
    expect(logged).not.toContain('private note 123')
  })
})

describe('buildPrompt', () => {
  it('trims very long fields', () => {
    const prompt = buildPrompt('mainAdvice', { reflections: ['y'.repeat(20000)] })
    expect(prompt.length).toBeLessThan(6000)
  })

  it('handles missing user data', () => {
    expect(buildPrompt('mindfulnessTip', undefined)).toContain('No mood data yet')
  })
})

// In-memory stand-in for a Netlify Blobs store with ETag-conditional writes
function fakeStore() {
  const data = new Map()
  let version = 0
  return {
    data,
    async getWithMetadata(key) {
      const entry = data.get(key)
      return entry ? { data: entry.value, etag: entry.etag, metadata: {} } : null
    },
    async set(key, value, { onlyIfMatch, onlyIfNew } = {}) {
      const entry = data.get(key)
      if (onlyIfNew && entry) return { modified: false }
      if (onlyIfMatch && (!entry || entry.etag !== onlyIfMatch)) return { modified: false }
      data.set(key, { value, etag: `e${++version}` })
      return { modified: true, etag: `e${version}` }
    },
  }
}

describe('daily caps (aiUsage)', () => {
  const now = new Date('2026-11-15T10:00:00Z')

  it('allows up to the per-user cap, then refuses', async () => {
    const store = fakeStore()
    for (let i = 0; i < PER_USER_DAILY_CAP; i++) {
      expect(await realClaimAiCall('u1', { store, now })).toBe('ok')
    }
    expect(await realClaimAiCall('u1', { store, now })).toBe('user_limit')
    // another user still gets through
    expect(await realClaimAiCall('u2', { store, now })).toBe('ok')
  })

  it('resets on a new UTC day', async () => {
    const store = fakeStore()
    store.data.set('user/2026-11-15/u1', { value: String(PER_USER_DAILY_CAP), etag: 'x' })
    expect(await realClaimAiCall('u1', { store, now })).toBe('user_limit')
    expect(await realClaimAiCall('u1', { store, now: new Date('2026-11-16T00:00:01Z') })).toBe('ok')
  })

  it('enforces the global ceiling across users', async () => {
    const store = fakeStore()
    store.data.set('global/2026-11-15', { value: String(GLOBAL_DAILY_CAP), etag: 'x' })
    expect(await realClaimAiCall('u9', { store, now })).toBe('global_limit')
  })

  it('counts parallel calls correctly (no lost updates)', async () => {
    const store = fakeStore()
    const results = await Promise.all(Array.from({ length: 30 }, () => realClaimAiCall('u1', { store, now })))
    expect(results.filter((r) => r === 'ok').length).toBeLessThanOrEqual(PER_USER_DAILY_CAP)
    expect(Number(store.data.get('user/2026-11-15/u1').value)).toBe(results.filter((r) => r === 'ok').length)
  })

  it('fails closed when the store throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = { getWithMetadata: () => Promise.reject(new Error('down')), set: vi.fn() }
    expect(await realClaimAiCall('u1', { store, now })).toBe('unavailable')
  })

  it('incrementUnderCap reports busy after losing every race', async () => {
    const store = { getWithMetadata: async () => ({ data: '1', etag: 'a' }), set: async () => ({ modified: false }) }
    expect(await incrementUnderCap(store, 'k', 5)).toBe('busy')
  })
})

describe('incrementUnderCap with the @netlify/blobs quirk', () => {
  it('treats a "modified" write without an ETag as lost (rejected parallel write)', async () => {
    let calls = 0
    const store = {
      getWithMetadata: async () => ({ data: '3', etag: 'a' }),
      set: async () => (++calls < 3 ? { modified: true, etag: '' } : { modified: true, etag: 'b' }),
    }
    expect(await incrementUnderCap(store, 'k', 5)).toBe('ok')
    expect(calls).toBe(3)
  })
})
