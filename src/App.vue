<template>
  <!-- Root app container -->
  <div id="app">
    <MainMenu /> <!-- Add main menu component -->
    <router-view></router-view> <!-- Renders the matched route component -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue' // Lifecycle hook
import { useUserStore } from './stores/user' // Pinia store for user state
import { supabase } from './supabase' // Supabase client
import MainMenu from './components/MainMenu.vue' // Import main menu component

// Get user store instance
const userStore = useUserStore()

// Lifecycle hook: Handle auth and notifications on mount
onMounted(async () => {
  // Load initial auth session
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    userStore.setUser(session.user) // Set user in store
    setupNotifications() // Initialize notifications if authenticated
  }

  // Listen for auth state changes (e.g., login/logout)
  supabase.auth.onAuthStateChange((_, session) => {
    userStore.setUser(session?.user || null) // Update store
    if (session) setupNotifications() // Setup notifications on login
  })
})

// Helper function to request and setup notifications
async function setupNotifications() {
  // Check permission status
  if (Notification.permission === 'granted') {
    startNotificationInterval() // Start if granted
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission() // Request permission
    if (permission === 'granted') {
      startNotificationInterval() // Start if granted
    }
  }
}

// Helper function to start periodic notifications
function startNotificationInterval() {
  // Array of motivational messages
  const messages = [
    'Remember your goals – you’re doing great!',
    'Stay mindful: one step at a time.',
    'You’re stronger than you think. Keep going!',
    'Hydrate and reflect – progress is progress.',
    'Proud of your efforts today!'
  ]

  // Set interval to show random notification every 30 minutes
  setInterval(() => {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)]
    new Notification('Alcohol Support Tracker', { body: randomMsg }) // Display notification
  }, 30 * 60 * 1000) // 30 minutes in ms
}
</script>

<style>
/* Global app styles (non-scoped for app-wide application) */
#app {
  min-height: 100vh; /* Full viewport height */
  display: flex; /* Flex layout */
  flex-direction: column; /* Column direction */
  background-color: #f9f9f9; /* Light background for app */
}
</style>