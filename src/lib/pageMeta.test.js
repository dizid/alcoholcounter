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

  // T-0636 (Nov 21 2026): the not-found route must not look like a real page
  it('a noindex route gets robots noindex and no canonical', () => {
    applyPageMeta({ path: '/login', meta: {} })
    applyPageMeta({ path: '/wp-login.php', meta: { title: 'Page not found', noindex: true } })
    expect(document.title).toBe('Page not found | DrinkTracker')
    expect(document.querySelector('meta[name="robots"]').content).toBe('noindex')
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('a real page after a not-found page is indexable again with its canonical', () => {
    applyPageMeta({ path: '/junk', meta: { noindex: true } })
    applyPageMeta({ path: '/privacy', meta: { title: 'Privacy' } })
    expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow')
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1)
    expect(document.querySelector('link[rel="canonical"]').href).toBe(`${SITE_ORIGIN}/privacy`)
  })
})
