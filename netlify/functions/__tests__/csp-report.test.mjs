// Tests for the CSP violation collector (T-0636)
import { describe, it, expect, vi, afterEach } from 'vitest'
import handler, { toReports, formatReport } from '../csp-report.mjs'

const post = (body) =>
  new Request('https://alcohol.dizid.com/api/csp-report', { method: 'POST', body })

describe('csp-report', () => {
  afterEach(() => vi.restoreAllMocks())

  it('logs a classic report-uri body as one line, without query strings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const body = JSON.stringify({
      'csp-report': {
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js?token=secret',
        'document-uri': 'https://alcohol.dizid.com/today?code=abc',
        disposition: 'report',
      },
    })
    const response = await handler(post(body))
    expect(response.status).toBe(204)
    expect(warn).toHaveBeenCalledTimes(1)
    const line = warn.mock.calls[0][0]
    expect(line).toContain('script-src-elem')
    expect(line).toContain('blocked=https://evil.example/x.js ')
    expect(line).not.toContain('secret')
    expect(line).not.toContain('code=abc')
  })

  it('reads Reporting API bodies and caps a batch at 5 lines', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const one = { type: 'csp-violation', body: { effectiveDirective: 'img-src', blockedURL: 'data' } }
    const other = { type: 'deprecation', body: {} }
    await handler(post(JSON.stringify([other, ...Array(8).fill(one)])))
    expect(warn).toHaveBeenCalledTimes(5)
  })

  it('answers 204 and logs nothing for GET, junk, empty and oversize bodies', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const get = await handler(new Request('https://alcohol.dizid.com/api/csp-report'))
    const junk = await handler(post('not json'))
    const empty = await handler(post(''))
    const big = await handler(post(JSON.stringify({ 'csp-report': { x: 'a'.repeat(20_000) } })))
    for (const response of [get, junk, empty, big]) expect(response.status).toBe(204)
    expect(warn).not.toHaveBeenCalled()
  })

  it('keeps log lines single-line', () => {
    const line = formatReport({ 'violated-directive': 'style-src\nfake line', 'script-sample': 'a\r\nb' })
    expect(line).not.toMatch(/[\r\n]/)
    expect(toReports({ other: true })).toEqual([])
  })
})
