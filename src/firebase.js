import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { SignInPageResolver, warmUpSignIn } from './lib/signInResolver'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

export const app = initializeApp(firebaseConfig)

// Same persistence list as getAuth(), so existing sessions stay signed in. The popup
// helper loads on the sign-in page instead of at startup (T-0636, see signInResolver.js).
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: SignInPageResolver,
})

export const googleProvider = new GoogleAuthProvider()

// Called by the sign-in page once it is drawn
export function prepareGoogleSignIn() {
  warmUpSignIn(auth)
}

export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider)
}

export async function logout() {
  await signOut(auth)
}

export async function getIdToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}
