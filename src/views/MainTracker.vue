<template>
  <!-- Main container for the daily drink tracker UI -->
  <div class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    
    <!-- Button to toggle the context form for adding a drink -->
    <button @click="showContextForm = true">+ Add Drink</button>
    
    <!-- Conditionally render the context form component -->
    <ContextForm v-if="showContextForm" @submit="handleAddDrink" @cancel="showContextForm = false" />
    
    <!-- Navigation buttons -->
    <button @click="goToDashboard">View Dashboard</button>
    <button @click="handleLogout">Logout</button>
    
    <!-- Display error message if any -->
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue' // Import Vue core utilities for reactivity and lifecycle
import { useRouter } from 'vue-router' // Import router for navigation
import { addDrinkLog, getTodayDrinkCount } from '../services/db' // Import DB service functions
import { logout } from '../services/auth' // Import auth service for logout
import ContextForm from '../components/ContextForm.vue' // Import child component for adding drink context

// Initialize router instance for programmatic navigation
const router = useRouter()

// Define reactive states for UI and data management
const drinkCount = ref(0) // Tracks the number of drinks logged today
const showContextForm = ref(false) // Controls visibility of the add drink form
const progressMessage = ref('') // Displays motivational message based on drink count
const error = ref('') // Stores any error messages for UI feedback

// Lifecycle hook: Fetch today's drink count when component mounts
onMounted(async () => {
  try {
    drinkCount.value = await getTodayDrinkCount() // Retrieve count from DB
    updateProgressMessage() // Update motivational message
  } catch (err) {
    console.error('Error fetching today\'s count:', err) // Log error for debugging
    error.value = 'Failed to load today\'s count.' // Set user-friendly error
  }
})

// Handler for adding a drink: Called from ContextForm submit event
async function handleAddDrink(context) {
  try {
    await addDrinkLog(context) // Log the drink to DB with context
    drinkCount.value += 1 // Increment local count
    updateProgressMessage() // Refresh motivational message
    showContextForm.value = false // Hide the form
    error.value = '' // Clear any previous errors
  } catch (err) {
    console.error('Error adding drink:', err) // Log error
    error.value = 'Failed to add drink.' // Set error message
  }
}

// Helper function to update progress message based on current drink count
function updateProgressMessage() {
  if (drinkCount.value === 0) {
    progressMessage.value = 'Great start! Keep it up today.'
  } else if (drinkCount.value < 3) {
    progressMessage.value = 'You’re being mindful – well done!'
  } else {
    progressMessage.value = 'Remember your goals. You can do this!'
  }
}

// Navigation handler: Go to dashboard route
function goToDashboard() {
  router.push('/dashboard')
}

// Handler for logout: Calls auth service and redirects
async function handleLogout() {
  try {
    await logout() // Perform logout via Supabase
    router.push('/') // Redirect to login/main page
    error.value = '' // Clear errors
  } catch (err) {
    console.error('Error logging out:', err) // Log error
    error.value = err.message // Display error
  }
}
</script>

<style scoped>
/* Scoped styles for the main container */
.main-container {
  text-align: center; /* Center all content */
  padding: 1rem; /* Add padding for spacing */
  transition: all 0.3s ease; /* Smooth transitions for better UX */
}

/* Style for error messages */
.error {
  color: #e74c3c; /* Red for errors */
  margin-top: 1rem; /* Space above error */
  font-weight: bold; /* Emphasize errors */
}
</style>