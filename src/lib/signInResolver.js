// Google popup sign-in helper that loads on the sign-in page, not at app start (T-0636).
//
// Google's popup sign-in needs a helper: an iframe plus ~140 KB of Google scripts.
// Firebase's getAuth() loads it at startup on phones and Safari, and there the
// signed-in state waits for it, so every phone visit paid for it (sign-in page:
// Lighthouse 75 with it, 99 without). SignInPageResolver is Firebase's own popup
// resolver minus that startup load. The sign-in page calls warmUpSignIn() once it is
// drawn, so the helper is ready before the tap: iPhone Safari blocks a popup that
// opens after a network wait.
//
// Uses two Firebase internals (_shouldInitProactively, _initialize);
// src/lib/signInResolver.test.js fails if an upgrade renames them.
import { browserPopupRedirectResolver } from 'firebase/auth'

export class SignInPageResolver extends browserPopupRedirectResolver {
  constructor() {
    super()
    // Firebase makes exactly one instance per resolver class; keep it for the warm-up
    SignInPageResolver.instance = this
  }

  // Firebase reads this once at startup; true would mean "load the helper now"
  get _shouldInitProactively() {
    return false
  }
}

// Loads the helper ahead of the tap. Safe to call more than once. If it fails, the
// tap loads it instead (fine on desktop and Android; iPhone may need a second tap).
export function warmUpSignIn(auth) {
  const resolver = SignInPageResolver.instance
  if (!resolver || typeof resolver._initialize !== 'function') return
  resolver._initialize(auth).catch(() => {})
}
