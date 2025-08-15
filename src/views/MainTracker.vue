<template>
  <div class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    
    <button @click="showContextForm = true">+ Add Drink</button>
    <button @click="resetCount">Reset Daily Count</button>
    
    <ContextForm v-if="showContextForm" @submit="handleAddDrink" @cancel="showContextForm = false" />
    
    <button @click="goToDashboard">View Dashboard</button>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount, resetTodayLogs } from '../services/db'
import { logout } from '../services/auth'
import ContextForm from '../components/ContextForm.vue'

const router = useRouter()
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')

// Fetch today's count on mount
onMounted(async () => {
  drinkCount.value = await getTodayDrinkCount()
  updateProgressMessage()
})

// Handle adding a drink with contexts
async function handleAddDrink(context) {
  try {
    await addDrinkLog(context)
    drinkCount.value += 1
    updateProgressMessage()
    showContextForm.value = false
  } catch (err) {
    console.error(err)
  }
}

// Update encouraging message based on count
function updateProgressMessage() {
  if (drinkCount.value === 0) {
    progressMessage.value = 'Great start! Keep it up today.'
  } else if (drinkCount.value < 3) {
    progressMessage.value = 'You’re being mindful – well done!'
  } else {
    progressMessage.value = 'Remember your goals. You can do this!'
  }
}

// Reset count
async function resetCount() {
  if (confirm('Reset today\'s count? This deletes today\'s logs.')) {
    await resetTodayLogs()
    drinkCount.value = 0
    updateProgressMessage()
  }
}

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<style scoped>
.main-container {
  text-align: center;
  padding: 1rem;
}
</style>