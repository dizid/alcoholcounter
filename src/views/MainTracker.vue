<template>
  <!-- Main container for the daily drink tracker UI -->
  <article class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    <!-- Navigation buttons with horizontal spacing -->
    <div class="button-group">
      <!-- Button to toggle the context form for adding a drink -->
      <button @click="showContextForm = true" class="add-drink-button">+ Add Drink</button>
      <!-- Second Save button for easy access -->
      <button @click="saveDrink" class="save-button">Save</button>
    </div>
    
    <!-- New collapsible mindfulness section -->
    <div class="mindfulness-section">

 <div class="button-group">

      <button @click="toggleMindfulness" class="mindfulness-button">
        {{ showMindfulness ? 'Hide Mindful Pause' : 'Mindful Pause' }}
      </button>

</div>


      <div v-if="showMindfulness" class="mindfulness-content">
        <!-- Tabs for different mindfulness approaches -->
        <div class="mindfulness-tabs">
           <button 
            v-for="tab in tabs" 
            :key="tab.id" 
            @click="activeTab = tab.id" 
            :class="{ 'active-tab': activeTab === tab.id }"
          >
            {{ tab.label }}
          </button>
          </div>
        
        <!-- Tab content for Present-Moment Awareness -->
        <div v-if="activeTab === 'awareness'" class="tab-content">
          <h3>Breathing Exercise</h3>
          <p>Focus on your breath: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.</p>
          <p>Notice sensations in your body right now without judgment.</p>
        </div>
        
        <!-- Tab content for Acceptance Strategies -->
        <div v-if="activeTab === 'acceptance'" class="tab-content">
          <h3>Accept the Urge</h3>
          <p>Acknowledge the craving: "I notice an urge to drink, and that's okay. It will pass."</p>
          <p>Visualize thoughts as clouds drifting by—observe, don't engage.</p>
        </div>
        
        <!-- Tab content for Urge Surfing (MBRP-Inspired) -->
        <div v-if="activeTab === 'intervention'" class="tab-content">
          <h3>Urge Surfing</h3>
          <p>Ride the wave: Describe the urge (intensity, location in body), watch it peak and fade over 1-2 minutes.</p>
          <p>Remind yourself: "This is temporary; I can choose differently."</p>
        </div>
      </div>
    </div>
    
    <!-- Conditionally render the context form component -->
    <ContextForm v-if="showContextForm" @submit="handleAddDrink" @cancel="showContextForm = false" />   
    
    <!-- Display error message if any -->
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount, getHistoricalCounts } from '../services/db'
import ContextForm from '../components/ContextForm.vue'

// Reactive state for UI
const router = useRouter()
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')
const error = ref('')

// New reactive state for mindfulness section
const showMindfulness = ref(false)
const activeTab = ref('awareness')
const tabs = [
  { id: 'awareness', label: 'Present-Moment Awareness' },
  { id: 'acceptance', label: 'Acceptance Strategies' },
  { id: 'intervention', label: 'Urge Surfing' }
]

// Toggle mindfulness section visibility
function toggleMindfulness() {
  showMindfulness.value = !showMindfulness.value
}

// Fetch historical data to calculate average daily drinks
async function getAverageDailyDrinks() {
  try {
    const counts = await getHistoricalCounts(30) // Get last 30 days
    const totalDrinks = Object.values(counts).reduce((sum, count) => sum + count, 0)
    return totalDrinks / 30 // Calculate average
  } catch (err) {
    console.error('Error fetching historical counts:', err)
    return 0 // Fallback to 0 if error
  }
}

// Initialize component data
onMounted(async () => {
  try {
    drinkCount.value = await getTodayDrinkCount()
    updateProgressMessage()
  } catch (err) {
    console.error('Error fetching today\'s count:', err)
    error.value = 'Failed to load today\'s count.'
  }
})

// Handle adding a new drink
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

// Handle the Save button click
async function saveDrink() {
  if (showContextForm.value) {
    try {
      await handleAddDrink({}) // Assume empty context if form is open
      showContextForm.value = false
    } catch (err) {
      console.error('Error saving drink:', err)
      error.value = 'Failed to save drink.'
    }
  } else {
    showContextForm.value = true // Open form if not already open
  }
}

// Update progress message based on drink count and historical average
async function updateProgressMessage() {
  const averageDrinks = await getAverageDailyDrinks()
  const messages = [
    {
      maxDrinks: 0,
      message: "Fantastic! No drinks today – you're rocking it!"
    },
    {
      maxDrinks: 1,
      message: "Just one drink today? You're staying super mindful!"
    },
    {
      maxDrinks: 3,
      message: "A few drinks today. Keep your goals in sight!"
    },
    {
      maxDrinks: 5,
      message: "You're at a higher count today. Take a moment to reflect!"
    },
    {
      maxDrinks: Infinity,
      message: "Quite a few drinks today. You can reset tomorrow!"
    }
  ]

  // Find appropriate message based on drink count
  const selectedMessage = messages.find(m => drinkCount.value <= m.maxDrinks)?.message || messages[messages.length - 1].message

  // Add context based on historical average
  let contextMessage = ''
  if (averageDrinks > 0) {
    if (drinkCount.value < averageDrinks) {
      contextMessage = ` That's below your ${averageDrinks.toFixed(1)} average – great progress!`
    } else if (drinkCount.value === averageDrinks) {
      contextMessage = ` That's right at your ${averageDrinks.toFixed(1)} average. Keep it steady!`
    } else {
      contextMessage = ` That's above your ${averageDrinks.toFixed(1)} average. You’ve got this for next time!`
    }
  }

  // Add a motivational tip
  const tips = [
    'Try a refreshing non-alcoholic drink to mix things up!',
    'Check out your Dashboard for insights on your progress.',
    'Set a small goal for tomorrow to stay on track.',
    'Take a moment to journal your thoughts – it can help!'
  ]
  const randomTip = tips[Math.floor(Math.random() * tips.length)]

  // Combine message, context, and tip
  progressMessage.value = `${selectedMessage}${contextMessage} ${randomTip}`
}
</script>