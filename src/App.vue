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
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { supabase } from './supabase'
import MainMenu from './components/MainMenu.vue'

const userStore = useUserStore()

onMounted(async () => {
  // First check if a session exists in localStorage
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    // Session exists - validate it against server
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error && user) {
      // Valid session
      userStore.setUser(user)
      setupNotifications()
    } else {
      // Session exists but is invalid/expired
      console.warn('Session expired, clearing user state')
      userStore.setUser(null)
      await supabase.auth.signOut({ scope: 'local' })
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
})

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
  }, 30 * 60 * 1000)
}
</script>