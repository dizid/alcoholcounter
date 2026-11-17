// T-0609: the AI-consent setting (server stamps the time of the yes)
import { describe, it, expect } from 'vitest'
import { readSettings } from '../api-goals.mjs'

describe('readSettings aiConsent (T-0609)', () => {
  it('stores the server time for a yes', () => {
    const before = Date.now()
    const { values, error } = readSettings({ aiConsent: true })
    expect(error).toBeUndefined()
    const stamped = Date.parse(values.aiConsentAt)
    expect(stamped).toBeGreaterThanOrEqual(before - 1000)
    expect(stamped).toBeLessThanOrEqual(Date.now() + 1000)
  })

  it('clears the consent for a no', () => {
    expect(readSettings({ coachOn: false, aiConsent: false }).values).toEqual({ coachOn: false, aiConsentAt: null })
  })

  it('refuses anything but true/false', () => {
    expect(readSettings({ aiConsent: 'yes' }).error).toMatch(/aiConsent/)
  })

  it('never takes a time from the app', () => {
    expect(readSettings({ aiConsentAt: '2020-01-01T00:00:00Z' }).values).toEqual({})
  })
})
