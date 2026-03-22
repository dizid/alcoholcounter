<template>
  <!-- Root app container -->
  <div id="app">
    <header>
      <MainMenu />
    </header>
    <main>
      <router-view></router-view>
    </main>
    <footer>
      <!-- Optional footer content can be added here -->
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'
import { useUserStore } from './stores/user'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { addDrinkLog } from './services/db'
import MainMenu from './components/MainMenu.vue'

const userStore = useUserStore()

// Provide a quick log trigger that MainTracker can listen to
const quickLogTrigger = ref(0)
provide('quickLogTrigger', quickLogTrigger)

// Store notification interval ID for cleanup
const notificationIntervalId = ref(null)

// Unsubscribe handle for the auth listener
let unsubscribeAuth = null

onMounted(() => {
  // Listen for Firebase auth state changes (login, logout, token refresh)
  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    userStore.setUser(user)
    if (user) {
      setupNotifications()
    } else {
      // Clear notification interval when user logs out
      if (notificationIntervalId.value) {
        clearInterval(notificationIntervalId.value)
        notificationIntervalId.value = null
      }
    }
  })

  // Check for quick-log action from URL (used by notification click)
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('action') === 'quicklog') {
    handleQuickLogFromNotification()
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }
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

// Clean up when component unmounts
onBeforeUnmount(() => {
  if (notificationIntervalId.value) {
    clearInterval(notificationIntervalId.value)
    notificationIntervalId.value = null
  }
  if (unsubscribeAuth) unsubscribeAuth()
})

function showNotificationWithAction(body, includeAction) {
  const notification = new Notification('DrinkTracker', {
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
