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
    
    <!-- Collapsible mindfulness section -->
   
    <div class="mindfulness-section">
        <div class="button-group"></div>
      <button @click="toggleMindfulness" class="mindfulness-button">
        {{ showMindfulness ? 'Hide Mindful Pause' : 'Mindful Pause' }}
      </button>
    </div>
      <div v-if="showMindfulness" class="mindfulness-content">
        <!-- Tabs for mindfulness approaches -->
        <div class="mindfulness-tabs">
          <button 
            v-for="tab in mindfulnessTabs" 
            :key="tab.id" 
            @click="activeMindfulnessTab = tab.id" 
            :class="{ 'active-tab': activeMindfulnessTab === tab.id }"
          >
            {{ tab.label }}
          </button>
        </div>
        <!-- Mindfulness tab content -->
        <div v-if="activeMindfulnessTab === 'awareness'" class="tab-content">
          <h3>Breathing Exercise</h3>
          <p>Focus on your breath: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.</p>
          <p>Notice sensations in your body right now without judgment.</p>
        </div>
        <div v-if="activeMindfulnessTab === 'acceptance'" class="tab-content">
          <h3>Accept the Urge</h3>
          <p>Acknowledge the craving: "I notice an urge to drink, and that's okay. It will pass."</p>
          <p>Visualize thoughts as clouds drifting by—observe, don't engage.</p>
        </div>
        <div v-if="activeMindfulnessTab === 'intervention'" class="tab-content">
          <h3>Urge Surfing</h3>
          <p>Ride the wave: Describe the urge (intensity, location in body), watch it peak and fade over 1-2 minutes.</p>
          <p>Remind yourself: "This is temporary; I can choose differently."</p>
        </div>
      </div>
    </div>
    
    <!-- Collapsible CBT section -->
    <div class="cbt-section">
      <div class="button-group">
      <button @click="toggleCbt" class="cbt-button">
        {{ showCbt ? 'Hide CBT Strategies' : 'CBT Strategies' }}
      </button>
      </div>
      <div v-if="showCbt" class="cbt-content">
        <!-- Tabs for CBT techniques -->
        <div class="cbt-tabs">
          <button 
            v-for="tab in cbtTabs" 
            :key="tab.id" 
            @click="activeCbtTab = tab.id" 
            :class="{ 'active-tab': activeCbtTab === tab.id }"
          >
            {{ tab.label }}
          </button>
        </div>
        <!-- CBT tab content: Trigger Identification -->
        <div v-if="activeCbtTab === 'triggers'" class="tab-content">
          <h3>Identify Your Triggers</h3>
          <p>Pinpoint what prompts your urge to drink and plan a healthier response.</p>
          <form @submit.prevent="addCopingStrategy" class="trigger-form">
            <label for="trigger-input">Trigger (e.g., Feeling stressed after work):</label>
            <input id="trigger-input" v-model="triggerInput" placeholder="Enter your trigger" required />
            <label for="coping-input">Coping Strategy (e.g., Take a walk):</label>
            <input id="coping-input" v-model="copingStrategyInput" placeholder="Enter a coping strategy" />
            <button type="submit" :disabled="!triggerInput" class="action-button">Save Trigger & Strategy</button>
          </form>
          <p v-if="copingFeedback" class="success">{{ copingFeedback }}</p>
          <!-- Display list of saved triggers and coping strategies -->
          <h4 v-if="userTriggers.length > 0">Your Saved Triggers</h4>
          <ul class="trigger-list" v-if="userTriggers.length > 0">
            <li v-for="trig in userTriggers" :key="trig.id">
              <strong>Trigger:</strong> {{ trig.trigger_text }} 
              <span v-if="trig.coping_strategy">| <strong>Strategy:</strong> {{ trig.coping_strategy }}</span>
              <span> - {{ new Date(trig.created_at).toLocaleString() }}</span>
            </li>
          </ul>
          <p v-else class="info">No triggers saved yet. Add one above!</p>
        </div>
        <!-- CBT tab content: Thought Reframing -->
        <div v-if="activeCbtTab === 'reframing'" class="tab-content">
          <h3>Challenge and Reframe Thoughts</h3>
          <p>Identify a negative thought (e.g., "I need to drink to relax") and reframe it (e.g., "I can relax with deep breathing").</p>
          <input v-model="thoughtInput" placeholder="Enter a negative thought" />
          <button @click="reframeThought" :disabled="!thoughtInput" class="action-button">Reframe Thought</button>
          <p v-if="reframedThought" class="success">{{ reframedThought }}</p>
        </div>
        <!-- CBT tab content: Skills Training -->
        <div v-if="activeCbtTab === 'skills'" class="tab-content">
          <h3>Skills for High-Risk Situations</h3>
          <p>Practice refusing a drink: "No thanks, I'm good with water."</p>
          <p><strong>Exercise</strong>: Imagine a social event. Plan how to say no or choose a non-alcoholic drink.</p>
          <p>Try deep breathing to manage cravings: Inhale for 4, exhale for 4, repeat 3 times.</p>
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
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount, getHistoricalCounts, addUserTrigger, getUserTriggers } from '../services/db'
import ContextForm from '../components/ContextForm.vue'

// Reactive state for UI
const router = useRouter()
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')
const error = ref('')

// Reactive state for mindfulness section
const showMindfulness = ref(false)
const activeMindfulnessTab = ref('awareness')
const mindfulnessTabs = [
  { id: 'awareness', label: 'Present-Moment Awareness' },
  { id: 'acceptance', label: 'Acceptance Strategies' },
  { id: 'intervention', label: 'Urge Surfing' }
]

// Reactive state for CBT section
const showCbt = ref(false)
const activeCbtTab = ref('triggers')
const cbtTabs = [
  { id: 'triggers', label: 'Trigger Identification' },
  { id: 'reframing', label: 'Thought Reframing' },
  { id: 'skills', label: 'Skills Training' }
]
const triggerInput = ref('')
const copingStrategyInput = ref('') // New: Input for coping strategy
const thoughtInput = ref('')
const copingFeedback = ref('')
const reframedThought = ref('')
const userTriggers = ref([])

// Toggle mindfulness section visibility
function toggleMindfulness() {
  showMindfulness.value = !showMindfulness.value
}

// Toggle CBT section visibility
function toggleCbt() {
  showCbt.value = !showCbt.value
}

// Fetch user triggers when CBT section is opened (lazy load for performance)
watch(showCbt, async (newVal) => {
  if (newVal) {
    try {
      userTriggers.value = await getUserTriggers() // Fetch from Supabase
    } catch (err) {
      console.error('Error fetching user triggers:', err)
      error.value = 'Failed to load saved triggers.'
    }
  }
})

// Handle adding a trigger and coping strategy
async function addCopingStrategy() {
  if (triggerInput.value) {
    try {
      // Save trigger and optional coping strategy to Supabase
      await addUserTrigger(triggerInput.value, copingStrategyInput.value || null)
      
      // Show feedback
      copingFeedback.value = `Saved trigger "${triggerInput.value}"${copingStrategyInput.value ? ` with strategy "${copingStrategyInput.value}"` : ''}.`
      
      // Clear inputs and refetch triggers
      triggerInput.value = ''
      copingStrategyInput.value = ''
      userTriggers.value = await getUserTriggers()
      
      // Clear feedback after 5 seconds
      setTimeout(() => (copingFeedback.value = ''), 5000)
    } catch (err) {
      console.error('Error saving trigger:', err)
      error.value = 'Failed to save trigger.'
    }
  }
}

// Handle reframing a thought
function reframeThought() {
  if (thoughtInput.value) {
    const reframes = {
      'i need to drink to relax': 'I can relax with deep breathing or a short walk.',
      'drinking makes me fun': 'I can have fun by engaging in hobbies or conversations.',
      'i can\'t handle stress without alcohol': 'I can manage stress with exercise or journaling.'
    }
    const lowerThought = thoughtInput.value.toLowerCase()
    reframedThought.value = reframes[lowerThought] || `Try reframing "${thoughtInput.value}" to: "I can find healthier ways to cope."`
    thoughtInput.value = ''
    setTimeout(() => (reframedThought.value = ''), 5000)
  }
}

// Fetch historical data to calculate average daily drinks
async function getAverageDailyDrinks() {
  try {
    const counts = await getHistoricalCounts(30)
    const totalDrinks = Object.values(counts).reduce((sum, count) => sum + count, 0)
    return totalDrinks / 30
  } catch (err) {
    console.error('Error fetching historical counts:', err)
    return 0
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
      await handleAddDrink({})
      showContextForm.value = false
    } catch (err) {
      console.error('Error saving drink:', err)
      error.value = 'Failed to save drink.'
    }
  } else {
    showContextForm.value = true
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

  const selectedMessage = messages.find(m => drinkCount.value <= m.maxDrinks)?.message || messages[messages.length - 1].message
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

  const tips = [
    'Try a refreshing non-alcoholic drink to mix things up!',
    'Check out your Dashboard for insights on your progress.',
    'Set a small goal for tomorrow to stay on track.',
    'Take a moment to journal your thoughts – it can help!'
  ]
  const randomTip = tips[Math.floor(Math.random() * tips.length)]
  progressMessage.value = `${selectedMessage}${contextMessage} ${randomTip}`
}
</script>