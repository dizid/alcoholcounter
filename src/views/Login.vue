<!-- Login.vue — Google Sign-In only -->
<template>
  <div class="container">
    <h1>DrinkTracker</h1>
    <!-- T-0636: this is the first page every visitor sees, so say what the app does
         (text only, facts checked against the app Nov 20 2026) -->
    <p class="lead">See how much you really drink, and drink less. Free, private, no ads.</p>
    <ul class="points">
      <li>Log a beer, wine or spirit in one tap, counted in standard drinks.</li>
      <li>Set a daily and weekly limit and a goal for alcohol-free days.</li>
      <li>See your week, month and year, and your most common triggers.</li>
      <li>Optional AI coach, only after your OK.</li>
    </ul>

    <!-- Warning message for session expiry -->
    <div v-if="redirectMessage" class="warning-message" role="alert">
      {{ redirectMessage }}
    </div>

    <div class="divider">
      <span>Sign in with</span>
    </div>

    <button class="google-button" @click="handleGoogleLogin" :disabled="isLoading">
      <svg class="google-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
      </svg>
      <span v-if="isLoading">Loading...</span>
      <span v-else>Continue with Google</span>
    </button>

    <p v-if="error" class="error" role="alert" aria-live="assertive">{{ error }}</p>

    <!-- T-0609: what happens with your data, readable before signing in -->
    <p class="privacy-note">What happens with your data: <router-link to="/privacy">Privacy</router-link></p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginWithProvider, prepareSignIn } from '../services/auth'

const router = useRouter()
const route = useRoute()
const error = ref('')
const isLoading = ref(false)
const redirectMessage = ref('')
const redirectPath = ref('/')
let warmUpFrame = 0
let warmUpTimer = 0

onMounted(() => {
  if (route.query.error === 'session_expired') {
    redirectMessage.value = route.query.message || 'Your session has expired. Please log in again.'
  }
  if (route.query.redirect) {
    redirectPath.value = route.query.redirect
  }
  // T-0636: load Google's sign-in helper right after this page is drawn (not at app
  // start), so the page shows sooner and the popup is ready before the tap
  warmUpFrame = requestAnimationFrame(() => {
    warmUpTimer = setTimeout(prepareSignIn, 0)
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(warmUpFrame)
  clearTimeout(warmUpTimer)
})

async function handleGoogleLogin() {
  isLoading.value = true
  error.value = ''
  try {
    await loginWithProvider()
    // onAuthStateChanged in App.vue updates the store; router guard resolves
    router.push(redirectPath.value || '/')
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Google.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* T-0588 theme: warm dark, flat */
.container { min-height: 100vh; align-content: center; padding-bottom: 48px; }
h1 { font-size: 32px; }
.container > p { color: var(--muted); }
.container > p.lead { color: var(--ink); font-size: 18px; }
/* What the app does: plain list, a small sand dot per line */
.points { list-style: none; display: grid; gap: 6px; color: var(--muted); font-size: 15px; }
.points li { position: relative; padding-left: 18px; }
.points li::before {
  content: ''; position: absolute; left: 2px; top: .6em;
  width: 6px; height: 6px; border-radius: 50%; background: var(--drink);
}
.google-button {
  height: 52px; width: 100%; border-radius: 14px;
  background-color: var(--ink);
  color: var(--on-drink);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.warning-message {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--drink);
  padding: 12px;
  border-radius: 14px;
}

.error { color: var(--above); font-size: 14px; }
.privacy-note { margin-top: 24px; font-size: 14px; }
.privacy-note a { color: var(--drink); text-decoration: underline; }

.divider {
  display: flex;
  align-items: center;
  margin: 8px 0;
  color: var(--muted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
}
</style>
