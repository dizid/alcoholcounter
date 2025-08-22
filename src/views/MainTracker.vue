<template>
  <div class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    
    <button @click="showContextForm = true">+ Add Drink</button>
    <button @click="resetCount">Reset Daily Count</button>
    
    <ContextForm v-if="showContextForm" @submit="handleAddDrink" @cancel="showContextForm = false" />
    
    <button @click="goToDashboard">View Dashboard</button>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount, resetTodayLogs } from '../services/db'
import { logout } from '../services/auth'
import ContextForm from '../components/ContextForm.vue'

// Initialize router for navigation
const router = useRouter()

// Reactive state for drink tracking
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')

// Fetch today's count on component mount
onMounted(async () => {
  try {
    drinkCount.value = await getTodayDrinkCount()
    updateProgressMessage()
  } catch (err) {
    console.error('Error fetching today\'s count:', err)
  }
})

// Handle adding a drink with optional contexts
async function handleAddDrink(context) {
  try {
    await addDrinkLog(context)
    drinkCount.value += 1
    updateProgressMessage()
    showContextForm.value = false
  } catch (err) {
    console.error('Error adding drink:', err)
  }
}

// Update encouraging message based on drink count
function updateProgressMessage() {
  if (drinkCount.value === 0) {
    progressMessage.value = 'Great start! Keep it up today.'
  } else if (drinkCount.value < 3) {
    progressMessage.value = 'You’re being mindful – well done!'
  } else {
    progressMessage.value = 'Remember your goals. You can do this!'
  }
}

// Reset daily count with confirmation
async function resetCount() {
  if (confirm('Reset today\'s count? This deletes today\'s logs.')) {
    try {
      await resetTodayLogs()
      drinkCount.value = 0
      updateProgressMessage()
    } catch (err) {
      console.error('Error resetting count:', err)
    }
  }
}

// Navigate to dashboard
function goToDashboard() {
  router.push('/dashboard')
}

// Handle logout and redirect to main tracker
async function handleLogout() {
  try {
    await logout()
    router.push('/') // Redirect to main tracker; router guard handles login redirect if needed
  } catch (err) {
    console.error('Error logging out:', err)
  }
}
</script>

<style scoped>
.main-container {
  text-align: center;
  padding: 1rem;
}
</style>