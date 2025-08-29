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
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    userStore.setUser(session.user)
    setupNotifications()
  }

  supabase.auth.onAuthStateChange((_, session) => {
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