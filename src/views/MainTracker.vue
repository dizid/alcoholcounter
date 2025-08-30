<template>
  <!-- Main container for the daily drink tracker UI -->
  <article class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    
    <!-- Button to toggle the context form for adding a drink -->
    <button @click="showContextForm = true" class="add-drink-button">+ Add Drink</button>
    
    <!-- Second Save button for easy access -->
    <button @click="saveDrink" class="save-button">Save</button>
    
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

// Function to handle the second Save button
async function saveDrink() {
  if (showContextForm.value) {
    try {
      await handleAddDrink({}); // Assume empty context if form is open; adjust if needed
      showContextForm.value = false;
    } catch (err) {
      console.error('Error saving drink:', err);
      error.value = 'Failed to save drink.';
    }
  } else {
    showContextForm.value = true; // Open form if not already open
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