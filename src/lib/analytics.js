// src/lib/analytics.js
// Google Analytics loads only after the visitor says yes (T-0609, Marc OK Nov 17 2026).
// Before T-0609 the gtag script was in index.html and ran for everyone on page load.
// The choice is kept in this browser (localStorage). "No" means the Google script is
// never fetched; changing a yes into a no stops tracking and removes the _ga cookies.

export const MEASUREMENT_ID = 'G-MN2MDNRW4L'
const STORAGE_KEY = 'analyticsConsent' // 'granted' | 'denied'

let loaded = false

// The stored choice: 'granted', 'denied' or null (not asked yet / storage blocked)
export function getAnalyticsChoice() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

// Adds the gtag script once (same setup as Google's snippet)
export function loadAnalytics() {
  if (loaded) return
  loaded = true
  window[`ga-disable-${MEASUREMENT_ID}`] = false
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

// Removes Google Analytics cookies (_ga, _ga_<id>) on this host and its parent domains
function clearAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map(part => part.split('=')[0].trim())
    .filter(name => name === '_ga' || name.startsWith('_ga_'))
  const labels = window.location.hostname.split('.')
  const domains = labels.map((_, index) => labels.slice(index).join('.')).filter(domain => domain.includes('.'))
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`
  }
}

// Saves the visitor's choice and acts on it right away
export function setAnalyticsChoice(choice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Storage blocked (private mode): the choice holds for this page only
  }
  if (choice === 'granted') {
    loadAnalytics()
  } else {
    // Google's own opt-out flag stops hits from a script that already loaded
    window[`ga-disable-${MEASUREMENT_ID}`] = true
    clearAnalyticsCookies()
  }
}

// Called once at start-up: loads Analytics only for visitors who said yes before
export function startAnalyticsIfAllowed() {
  if (getAnalyticsChoice() === 'granted') loadAnalytics()
}
