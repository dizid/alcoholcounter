// T-0609: Google Analytics only after consent
import { describe, it, expect, beforeEach, vi } from 'vitest'

const scriptCount = () => document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length

describe('analytics consent (T-0609)', () => {
  let analytics

  beforeEach(async () => {
    // Fresh module state (the "loaded once" flag) and a clean page for every test
    vi.resetModules()
    document.head.innerHTML = ''
    localStorage.clear()
    delete window.gtag
    delete window.dataLayer
    analytics = await import('./analytics.js')
  })

  it('loads nothing when no choice was made', () => {
    analytics.startAnalyticsIfAllowed()
    expect(scriptCount()).toBe(0)
    expect(analytics.getAnalyticsChoice()).toBeNull()
  })

  it('loads nothing after "No thanks"', () => {
    analytics.setAnalyticsChoice('denied')
    analytics.startAnalyticsIfAllowed()
    expect(scriptCount()).toBe(0)
    expect(analytics.getAnalyticsChoice()).toBe('denied')
  })

  it('loads the script once after "Allow"', () => {
    analytics.setAnalyticsChoice('granted')
    analytics.startAnalyticsIfAllowed()
    expect(scriptCount()).toBe(1)
    expect(window.dataLayer.length).toBeGreaterThan(0)
  })

  it('a later "no" sets Google\'s opt-out flag and removes the _ga cookie', () => {
    analytics.setAnalyticsChoice('granted')
    document.cookie = '_ga=GA1.1.123; path=/'
    analytics.setAnalyticsChoice('denied')
    expect(window[`ga-disable-${analytics.MEASUREMENT_ID}`]).toBe(true)
    expect(document.cookie).not.toMatch(/_ga=/)
  })
})
