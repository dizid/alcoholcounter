// T-0636: Google's popup helper must not load at app start (it slowed every phone
// visit), but must still exist and be loadable for the sign-in page. Uses the real
// Firebase SDK (the global test setup mocks it), so a Firebase upgrade that renames
// the internals src/lib/signInResolver.js relies on fails here.
import { describe, it, expect, vi, afterEach } from 'vitest'

// The global setup mocks these; this file needs the real SDK. Tests run in Node,
// which gets Firebase's server build of auth (popup sign-in is a stub there), so
// load the browser build the app ships.
vi.mock('firebase/app', async importOriginal => await importOriginal())
vi.mock('firebase/auth', () => import('../../node_modules/@firebase/auth/dist/esm/index.js'))

import { initializeApp, deleteApp } from 'firebase/app'
import { initializeAuth, inMemoryPersistence, browserPopupRedirectResolver } from 'firebase/auth'
import { SignInPageResolver, warmUpSignIn } from './signInResolver'

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

// Pretend to be iPhone Safari, where Firebase normally loads the helper at startup
function useIphoneUserAgent() {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA)
}

describe('SignInPageResolver', () => {
  let app

  afterEach(async () => {
    vi.restoreAllMocks()
    if (app) await deleteApp(app)
    app = null
  })

  it('relies on Firebase internals that still exist', () => {
    const proto = browserPopupRedirectResolver.prototype
    expect(typeof proto._initialize).toBe('function')
    expect(typeof Object.getOwnPropertyDescriptor(proto, '_shouldInitProactively')?.get).toBe('function')
  })

  it('turns off the startup load that Firebase does on an iPhone', () => {
    useIphoneUserAgent()
    expect(new browserPopupRedirectResolver()._shouldInitProactively).toBe(true)
    expect(new SignInPageResolver()._shouldInitProactively).toBe(false)
  })

  it('lets sign-in state load on an iPhone without loading the helper', async () => {
    useIphoneUserAgent()
    const initSpy = vi.spyOn(browserPopupRedirectResolver.prototype, '_initialize')
    app = initializeApp({ apiKey: 'test-key', authDomain: 'test.firebaseapp.com', projectId: 'test' }, 'resolver-test')
    const auth = initializeAuth(app, { persistence: inMemoryPersistence, popupRedirectResolver: SignInPageResolver })
    await auth.authStateReady()
    expect(auth.currentUser).toBeNull()
    expect(initSpy).not.toHaveBeenCalled()

    // The sign-in page's warm-up loads it on the same instance Firebase uses for the popup
    initSpy.mockResolvedValue({})
    warmUpSignIn(auth)
    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(initSpy.mock.contexts[0]).toBe(SignInPageResolver.instance)
    expect(initSpy).toHaveBeenCalledWith(auth)
  })
})
