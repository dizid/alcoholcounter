<template>
  <!-- Root app container -->
  <div id="app">
    <!-- Loading state during auth initialization -->
    <div v-if="isInitializing" class="app-loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Error state if initialization fails -->
    <div v-else-if="initError" class="app-error">
      <p>{{ initError }}</p>
      <button @click="retryInit">Retry</button>
    </div>

    <!-- Main app content -->
    <template v-else>
      <header>
        <MainMenu />
      </header>
      <main>
        <router-view></router-view>
      </main>
      <footer>
        <!-- Optional footer content can be added here -->
      </footer>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'
import { useUserStore } from './stores/user'
import { supabase } from './supabase'
import { addDrinkLog } from './services/db'
import MainMenu from './components/MainMenu.vue'

const userStore = useUserStore()

// App initialization state
const isInitializing = ref(true)
const initError = ref('')

// Provide a quick log trigger that MainTracker can listen to
const quickLogTrigger = ref(0)
provide('quickLogTrigger', quickLogTrigger)

// Store notification interval ID for cleanup
const notificationIntervalId = ref(null)

// Helper to wrap async operations with timeout
function withTimeout(promise, ms, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ])
}

// Safe localStorage access (fails silently in private browsing mode)
function safeLocalStorageGet(key, defaultValue = null) {
  try {
    return localStorage.getItem(key) ?? defaultValue
  } catch (e) {
    console.warn('localStorage not available:', e)
    return defaultValue
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn('localStorage not available:', e)
    return false
  }
}

// Provide safe localStorage helpers to other components
provide('safeLocalStorageGet', safeLocalStorageGet)
provide('safeLocalStorageSet', safeLocalStorageSet)

// Initialize auth state
async function initializeAuth() {
  isInitializing.value = true
  initError.value = ''

  try {
    // First check if a session exists in localStorage (with timeout)
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      5000,
      'Session check timed out'
    )

    if (session) {
      // Session exists - validate it against server (with timeout)
      try {
        const { data: { user }, error } = await withTimeout(
          supabase.auth.getUser(),
          8000,
          'User validation timed out'
        )

        if (!error && user) {
          // Valid session
          userStore.setUser(user)
          setupNotifications()
        } else {
          // Session exists but is invalid/expired
          console.warn('Session expired, clearing user state')
          userStore.setUser(null)
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
        }
      } catch (validationError) {
        // If validation fails but we have a session, still allow the user through
        // The router guard will handle further validation
        console.warn('User validation failed, using cached session:', validationError)
        userStore.setUser(session.user)
      }
    } else {
      // No session exists - user is logged out
      userStore.setUser(null)
    }

    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, session) => {
      userStore.setUser(session?.user || null)
      if (session) setupNotifications()
    })

    // Check for quick-log action from URL (used by notification click)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('action') === 'quicklog') {
      await handleQuickLogFromNotification()
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  } catch (err) {
    console.error('Auth initialization error:', err)
    // On timeout or network error, clear user state and let router redirect to login
    userStore.setUser(null)
    // Only show error if it's not a timeout (timeouts just mean slow network, not broken app)
    if (!err.message?.includes('timed out')) {
      initError.value = 'Failed to connect. Please check your internet connection.'
    }
  } finally {
    isInitializing.value = false
  }
}

// Retry initialization
function retryInit() {
  initializeAuth()
}

onMounted(() => {
  initializeAuth()
})

// Handle quick log from notification
async function handleQuickLogFromNotification() {
  try {
    await addDrinkLog({})
    // Trigger refresh in MainTracker if it's mounted
    quickLogTrigger.value++
    // Show a brief confirmation
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Drink Logged', {
        body: 'Your drink has been recorded.',
        tag: 'quick-log-confirm',
        requireInteraction: false
      })
    }
  } catch (err) {
    console.error('Error quick logging from notification:', err)
  }
}

async function setupNotifications() {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    startNotificationInterval()
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      startNotificationInterval()
    }
  }
}

function startNotificationInterval() {
  // Clear any existing interval first
  if (notificationIntervalId.value) {
    clearInterval(notificationIntervalId.value)
  }

  const messages = [
    { text: "Remember your goals - you're doing great!", includeAction: true },
    { text: 'Stay mindful: one step at a time.', includeAction: false },
    { text: "You're stronger than you think. Keep going!", includeAction: false },
    { text: 'How are you doing? Tap to log a drink if needed.', includeAction: true },
    { text: 'Proud of your efforts today!', includeAction: false }
  ]

  notificationIntervalId.value = setInterval(() => {
    const msg = messages[Math.floor(Math.random() * messages.length)]
    showNotificationWithAction(msg.text, msg.includeAction)
  }, 30 * 60 * 1000)
}

// Clean up interval when component unmounts
onBeforeUnmount(() => {
  if (notificationIntervalId.value) {
    clearInterval(notificationIntervalId.value)
    notificationIntervalId.value = null
  }
})

function showNotificationWithAction(body, includeAction) {
  const notification = new Notification('Alcohol Support Tracker', {
    body: includeAction ? `${body}\n\nClick to log a drink` : body,
    icon: '/logo.png',
    tag: 'reminder',
    requireInteraction: false
  })

  if (includeAction) {
    notification.onclick = async (event) => {
      event.preventDefault()
      // Focus or open the app
      if (window.focus) window.focus()
      // Navigate to main page with quick-log action
      window.location.href = '/?action=quicklog'
    }
  }
}
</script>

<style scoped>
/* Loading state styles */
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  color: var(--text-secondary, #666);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border, #e0e0e0);
  border-top-color: var(--primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error state styles */
.app-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-primary, #333);
}

.app-error p {
  color: var(--error, #e74c3c);
  margin: 0;
}

.app-error button {
  padding: 0.75rem 1.5rem;
  background: var(--primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.app-error button:hover {
  opacity: 0.9;
}
</style>