<template>
  <!-- Main container for the daily drink tracker UI -->
  <article class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    
    <!-- Button to toggle the context form for adding a drink -->
    <button @click="showContextForm = true">+ Add Drink</button>
    
    <!-- Conditionally render the context form component -->
    <ContextForm v-if="showContextForm" @submit="handleAddDrink" @cancel="showContextForm = false" />
    
    <!-- Navigation buttons with horizontal spacing -->
    <div class="button-group">
      <button @click="goToDashboard">View Dashboard</button>
    </div>
    
    <!-- Display error message if any -->
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount } from '../services/db'
import { logout } from '../services/auth'
import ContextForm from '../components/ContextForm.vue'

const router = useRouter()
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')
const error = ref('')

onMounted(async () => {
  try {
    drinkCount.value = await getTodayDrinkCount()
    updateProgressMessage()
  } catch (err) {
    console.error('Error fetching today\'s count:', err)
    error.value = 'Failed to load today\'s count.'
  }
})

async function handleAddDrink(context) {
  try {
    await addDrinkLog(context)
    drinkCount.value += 1
    updateProgressMessage()
    showContextForm.value = false
    error.value = ''
  } catch (err) {
    console.error('Error adding drink:', err)
    error.value = 'Failed to add drink.'
  }
}

function updateProgressMessage() {
  if (drinkCount.value === 0) {
    progressMessage.value = 'Great start! Keep it up today.'
  } else if (drinkCount.value < 3) {
    progressMessage.value = 'You’re being mindful – well done!'
  } else {
    progressMessage.value = 'Remember your goals. You can do this!'
  }
}

function goToDashboard() {
  router.push('/dashboard')
}
</script>