// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { applyPageMeta, pageTitle, DEFAULT_DESCRIPTION, SITE_ORIGIN } from './pageMeta'

describe('pageTitle', () => {
  it('adds the site name to a short title', () => {
    expect(pageTitle({ title: 'Privacy' })).toBe('Privacy | DrinkTracker')
  })
  it('keeps a full title as is', () => {
    expect(pageTitle({ fullTitle: 'DrinkTracker: cut down' })).toBe('DrinkTracker: cut down')
  })
  it('falls back to the site name', () => {
    expect(pageTitle()).toBe('DrinkTracker')
  })
})

describe('applyPageMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="old">'
    document.title = 'old'
  })

  it('sets title, description and a canonical without query string', () => {
    applyPageMeta({ path: '/login', meta: { title: 'Sign in', description: 'Sign in here' } })
    expect(document.title).toBe('Sign in | DrinkTracker')
    expect(document.querySelector('meta[name="description"]').content).toBe('Sign in here')
    expect(document.querySelector('link[rel="canonical"]').href).toBe(`${SITE_ORIGIN}/login`)
    expect(document.querySelector('meta[property="og:url"]').content).toBe(`${SITE_ORIGIN}/login`)
    // The existing description tag is updated, not duplicated
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  })

  it('uses the default description when the route has none', () => {
    applyPageMeta({ path: '/log', meta: { title: 'Log' } })
    expect(document.querySelector('meta[name="description"]').content).toBe(DEFAULT_DESCRIPTION)
  })

  it('keeps one canonical link across route changes', () => {
    applyPageMeta({ path: '/login', meta: {} })
    applyPageMeta({ path: '/privacy', meta: {} })
    const links = document.querySelectorAll('link[rel="canonical"]')
    expect(links).toHaveLength(1)
    expect(links[0].href).toBe(`${SITE_ORIGIN}/privacy`)
  })
})
