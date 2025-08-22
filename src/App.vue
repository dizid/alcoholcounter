<template>
  <div id="app">
    <router-view></router-view> <!-- Renders the current page -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { supabase } from './supabase' // Import Supabase client

const userStore = useUserStore()

// Handle auth state changes and notifications
onMounted(async () => {
  // Load initial session
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    userStore.setUser(session.user)
    setupNotifications() // Setup notifications if logged in
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_, session) => {
    userStore.setUser(session?.user || null)
    if (session) setupNotifications()
  })
})

// Request notification permission and set interval for supportive notifications
async function setupNotifications() {
  if (Notification.permission === 'granted') {
    startNotificationInterval()
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      startNotificationInterval()
    }
  }
}

// Start interval for notifications every 30 minutes
function startNotificationInterval() {
  const messages = [
    'Remember your goals – you’re doing great!',
    'Stay mindful: one step at a time.',
    'You’re stronger than you think. Keep going!',
    'Hydrate and reflect – progress is progress.',
    'Proud of your efforts today!'
  ]

  setInterval(() => {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)]
    new Notification('Alcohol Support Tracker', { body: randomMsg })
  }, 30 * 60 * 1000) // 30 minutes
}
</script>

<style>
/* App-level styles if needed (most in styles.css) */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>


