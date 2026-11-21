// Per-page title, description and canonical link (T-0636, Nov 20 2026).
// The app is one index.html for every address, so without this every page told
// search engines it was the home page (canonical "/") with the same title.
// Google's advice when JavaScript sets the canonical: leave it out of the HTML,
// so index.html has no canonical link and this file adds it after each route change.

export const SITE_ORIGIN = 'https://alcohol.dizid.com'
export const SITE_NAME = 'DrinkTracker'

// Used when a route sets no description of its own
export const DEFAULT_DESCRIPTION =
  'Free, private app to track your drinking and cut down: log a drink in one tap, set a daily and weekly limit, count alcohol-free days and see your patterns.'

// Builds the browser tab title: "Today | DrinkTracker", or the full title as is
export function pageTitle(meta = {}) {
  if (meta.fullTitle) return meta.fullTitle
  if (meta.title) return `${meta.title} | ${SITE_NAME}`
  return SITE_NAME
}

// Finds a <meta>/<link> tag by selector, or creates it with the given attributes
function upsertTag(doc, selector, tagName, attributes) {
  let element = doc.head.querySelector(selector)
  if (!element) {
    element = doc.createElement(tagName)
    doc.head.appendChild(element)
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
  return element
}

// Applies the route's title, description and canonical URL to the document.
// The canonical is the path without query string or hash (/login?redirect=/ → /login).
// meta.noindex (the not-found route, T-0636 Nov 21 2026): robots "noindex" and no
// canonical, so an unknown address never claims to be a real page.
export function applyPageMeta(route, doc = document) {
  const meta = route.meta || {}
  const title = pageTitle(meta)
  const description = meta.description || DEFAULT_DESCRIPTION
  const url = SITE_ORIGIN + route.path

  doc.title = title
  upsertTag(doc, 'meta[name="description"]', 'meta', { name: 'description', content: description })
  upsertTag(doc, 'meta[name="robots"]', 'meta', { name: 'robots', content: meta.noindex ? 'noindex' : 'index, follow' })
  if (meta.noindex) {
    doc.head.querySelector('link[rel="canonical"]')?.remove()
  } else {
    upsertTag(doc, 'link[rel="canonical"]', 'link', { rel: 'canonical', href: url })
  }
  upsertTag(doc, 'meta[property="og:url"]', 'meta', { property: 'og:url', content: url })
  upsertTag(doc, 'meta[property="og:title"]', 'meta', { property: 'og:title', content: title })
  upsertTag(doc, 'meta[property="og:description"]', 'meta', { property: 'og:description', content: description })
}
