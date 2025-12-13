<template>
  <!-- Main container for the daily drink tracker UI -->
  <article class="main-container">
    <h1>Daily Drink Tracker</h1>
    <p>Current drinks today: {{ drinkCount }}</p>
    <p>{{ progressMessage }}</p>
    <!-- Navigation buttons with horizontal spacing -->
    <div class="button-group">
      <button @click="showContextForm = true" class="add-drink-button">+ Add Drink</button>
      <button @click="saveDrink" class="save-button">Save</button>
    </div>
    
    <!-- Collapsible mindfulness section -->
    <div class="mindfulness-section">
      <button @click="toggleMindfulness" class="mindfulness-button">
        {{ showMindfulness ? 'Hide Mindful Pause' : 'Mindful Pause' }}
        <span v-if="streak > 0" class="streak-counter">Streak: {{ streak }} days</span>
      </button>
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
        <!-- Mindfulness tab content: Present-Moment Awareness with timer -->
        <div v-if="activeMindfulnessTab === 'awareness'" class="tab-content">
          <h3>Breathing Exercise</h3>
          <p>Focus on your breath: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.</p>
          <button @click="startBreathTimer" class="action-button" :disabled="isTimerRunning">Start Timer</button>
          <p v-if="timerDisplay" class="timer-display">{{ timerDisplay }}</p>
          <p v-if="breathFeedback" class="success">{{ breathFeedback }}</p>
          <!-- Reflection input -->
          <textarea v-model="reflectionInput" placeholder="How did this exercise make you feel? (Optional reflection)"></textarea>
          <button @click="saveReflection('awareness')" class="action-button" :disabled="!reflectionInput">Save Reflection</button>
          <p v-if="reflectionFeedback" class="success">{{ reflectionFeedback }}</p>
          <!-- Reflections list -->
          <h4 v-if="filteredReflections.length > 0">Your Reflections</h4>
          <ul class="reflection-list" v-if="filteredReflections.length > 0">
            <li v-for="refl in filteredReflections" :key="refl.id">
              {{ refl.reflection_text }} - {{ new Date(refl.created_at).toLocaleString() }}
            </li>
          </ul>
          <p v-else class="info">No reflections saved yet for this exercise.</p>
        </div>
        <!-- Mindfulness tab content: Acceptance Strategies with AI tip -->
        <div v-if="activeMindfulnessTab === 'acceptance'" class="tab-content">
          <h3>Accept the Urge</h3>
          <p>Acknowledge the craving: "I notice an urge to drink, and that's okay. It will pass."</p>
          <p>Visualize thoughts as clouds drifting by—observe, don't engage.</p>
          <p v-if="aiTipLoading" class="info">Loading AI tip...</p>
          <p v-else-if="aiTipError" class="error">{{ aiTipError }}</p>
          <p v-else><strong>AI Tip:</strong> {{ aiTip }}</p>
          <button @click="fetchAiTip" class="action-button">Get Another AI Tip</button>
          <!-- Reflection input -->
          <textarea v-model="reflectionInput" placeholder="How did this exercise make you feel? (Optional reflection)"></textarea>
          <button @click="saveReflection('acceptance')" class="action-button" :disabled="!reflectionInput">Save Reflection</button>
          <p v-if="reflectionFeedback" class="success">{{ reflectionFeedback }}</p>
          <!-- Reflections list -->
          <h4 v-if="filteredReflections.length > 0">Your Reflections</h4>
          <ul class="reflection-list" v-if="filteredReflections.length > 0">
            <li v-for="refl in filteredReflections" :key="refl.id">
              {{ refl.reflection_text }} - {{ new Date(refl.created_at).toLocaleString() }}
            </li>
          </ul>
          <p v-else class="info">No reflections saved yet for this exercise.</p>
        </div>
        <!-- Mindfulness tab content: Urge Surfing with interactive steps -->
        <div v-if="activeMindfulnessTab === 'intervention'" class="tab-content">
          <h3>Urge Surfing</h3>
          <p>Ride the wave of your urge. Follow these steps:</p>
          <ul class="step-list">
            <li>
              <input type="checkbox" id="step1" v-model="stepsCompleted[0]" />
              <label for="step1">Describe the urge (intensity, location in body).</label>
            </li>
            <li>
              <input type="checkbox" id="step2" v-model="stepsCompleted[1]" />
              <label for="step2">Watch it peak and fade over 1-2 minutes.</label>
            </li>
            <li>
              <input type="checkbox" id="step3" v-model="stepsCompleted[2]" />
              <label for="step3">Remind yourself: "This is temporary; I can choose differently."</label>
            </li>
          </ul>
          <p v-if="allStepsCompleted" class="success">Great job completing the steps!</p>
          <!-- Reflection input -->
          <textarea v-model="reflectionInput" placeholder="How did this exercise make you feel? (Optional reflection)"></textarea>
          <button @click="saveReflection('intervention')" class="action-button" :disabled="!reflectionInput">Save Reflection</button>
          <p v-if="reflectionFeedback" class="success">{{ reflectionFeedback }}</p>
          <!-- Reflections list -->
          <h4 v-if="filteredReflections.length > 0">Your Reflections</h4>
          <ul class="reflection-list" v-if="filteredReflections.length > 0">
            <li v-for="refl in filteredReflections" :key="refl.id">
              {{ refl.reflection_text }} - {{ new Date(refl.created_at).toLocaleString() }}
            </li>
          </ul>
          <p v-else class="info">No reflections saved yet for this exercise.</p>
        </div>
      </div>
    </div>
    
    <!-- Collapsible CBT section -->
    <div class="cbt-section">
      <button @click="toggleCbt" class="cbt-button">
        {{ showCbt ? 'Hide CBT Strategies' : 'CBT Strategies' }}
      </button>
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
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addDrinkLog, getTodayDrinkCount, getHistoricalCounts, addUserTrigger, getUserTriggers, addUserReflection, getUserReflections, logMindfulnessSession } from '../services/db'
import { getMindfulnessTip } from '../services/grok'
import { isAuthError, handleAuthError } from '../services/authErrorHandler'
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
const timer = ref(0)
const isTimerRunning = ref(false)
const timerInterval = ref(null)
const breathFeedback = ref('')
const reflectionInput = ref('')
const reflectionFeedback = ref('')
const aiTip = ref('')
const aiTipLoading = ref(false)
const aiTipError = ref('')
const stepsCompleted = ref([false, false, false])
const userReflections = ref([])
const streak = ref(0)

// Reactive state for CBT section
const showCbt = ref(false) // Added to fix undefined error
const activeCbtTab = ref('triggers')
const cbtTabs = [
  { id: 'triggers', label: 'Trigger Identification' },
  { id: 'reframing', label: 'Thought Reframing' },
  { id: 'skills', label: 'Skills Training' }
]
const triggerInput = ref('')
const copingStrategyInput = ref('')
const thoughtInput = ref('')
const copingFeedback = ref('')
const reframedThought = ref('')
const userTriggers = ref([])

// Computed for all steps completed in urge surfing
const allStepsCompleted = computed(() => stepsCompleted.value.every(step => step))

// Computed for filtered reflections by current tab
const filteredReflections = computed(() => 
  userReflections.value.filter(refl => refl.exercise_type === activeMindfulnessTab.value)
)

// Timer display formatted as MM:SS
const timerDisplay = computed(() => {
  const minutes = Math.floor(timer.value / 60)
  const seconds = timer.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

// Start breath timer for 5 cycles of 4-4-4 (total 60 seconds)
function startBreathTimer() {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  timer.value = 60
  breathFeedback.value = ''
  timerInterval.value = setInterval(() => {
    timer.value -= 1
    if (timer.value <= 0) {
      stopTimer()
      breathFeedback.value = 'Well done! You completed the breathing exercise.'
    }
  }, 1000)
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance('Inhale for 4, hold for 4, exhale for 4. Repeat 5 times.')
    speechSynthesis.speak(utterance)
  }
}

// Stop timer
function stopTimer() {
  clearInterval(timerInterval.value)
  isTimerRunning.value = false
}

// Save user reflection
async function saveReflection(exerciseType) {
  if (reflectionInput.value) {
    try {
      await addUserReflection(reflectionInput.value, exerciseType)
      reflectionFeedback.value = 'Reflection saved successfully!'
      reflectionInput.value = ''
      userReflections.value = await getUserReflections()
      setTimeout(() => (reflectionFeedback.value = ''), 5000)
    } catch (err) {
      console.error('Error saving reflection:', err)

      // Handle auth errors specifically
      if (isAuthError(err)) {
        await handleAuthError(err, 'saveReflection')
        return
      }

      error.value = 'Failed to save reflection. Please try again.'
    }
  }
}

// Fetch AI mindfulness tip
async function fetchAiTip() {
  try {
    aiTipLoading.value = true
    aiTipError.value = ''
    const triggers = await getUserTriggers()
    aiTip.value = await getMindfulnessTip(triggers)
  } catch (err) {
    console.error('Error fetching AI tip:', err)
    aiTipError.value = 'Failed to load AI tip.'
  } finally {
    aiTipLoading.value = false
  }
}

// Calculate and update streak
async function updateStreak() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const sessions = await logMindfulnessSession()
    const uniqueDates = [...new Set(sessions.map(s => s.session_date.split('T')[0]))].sort()
    let currentStreak = 0
    const todayDate = new Date(today)
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const sessionDate = new Date(uniqueDates[i])
      const diffDays = Math.floor((todayDate - sessionDate) / (1000 * 60 * 60 * 24))
      if (diffDays === currentStreak) {
        currentStreak++
      } else if (diffDays > currentStreak) {
        break
      }
    }
    streak.value = currentStreak
    localStorage.setItem('mindfulnessStreak', currentStreak)
  } catch (err) {
    console.error('Error updating streak:', err)
    streak.value = 0
  }
}

// Toggle mindfulness section visibility
function toggleMindfulness() {
  showMindfulness.value = !showMindfulness.value
  if (showMindfulness.value) {
    fetchAiTip()
    updateStreak()
    getUserReflections().then(reflections => {
      userReflections.value = reflections
    }).catch(err => {
      console.error('Error fetching reflections:', err)
      error.value = 'Failed to load reflections.'
    })
  }
}

// Generate random tip (fallback for acceptance)
function generateRandomTip(tab) {
  if (tab === 'acceptance' && !aiTip.value) {
    const tips = [
      'Visualize your urge as a wave—it rises and falls naturally.',
      'Label your thoughts gently: "This is just a craving thought."',
      'Practice self-compassion: Be kind to yourself in this moment.',
      'Focus on one sense: What do you hear or feel right now?'
    ]
    aiTip.value = tips[Math.floor(Math.random() * tips.length)]
  }
}

// Toggle CBT section visibility
function toggleCbt() {
  showCbt.value = !showCbt.value
}

// Fetch user triggers when CBT section is opened
watch(showCbt, async (newVal) => {
  if (newVal) {
    try {
      userTriggers.value = await getUserTriggers()
    } catch (err) {
      console.error('Error fetching user triggers:', err)
      error.value = 'Failed to load saved triggers.'
    }
  }
})

// Handle adding a coping strategy for triggers
async function addCopingStrategy() {
  if (triggerInput.value) {
    try {
      await addUserTrigger(triggerInput.value, copingStrategyInput.value || null)
      copingFeedback.value = `Saved trigger "${triggerInput.value}"${copingStrategyInput.value ? ` with strategy "${copingStrategyInput.value}"` : ''}.`
      triggerInput.value = ''
      copingStrategyInput.value = ''
      userTriggers.value = await getUserTriggers()
      setTimeout(() => (copingFeedback.value = ''), 5000)
    } catch (err) {
      console.error('Error saving trigger:', err)

      // Handle auth errors specifically
      if (isAuthError(err)) {
        await handleAuthError(err, 'addCopingStrategy')
        return
      }

      error.value = 'Failed to save trigger. Please try again.'
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
    // Initialize streak from localStorage
    streak.value = parseInt(localStorage.getItem('mindfulnessStreak') || '0')
  } catch (err) {
    console.error('Error fetching today\'s count:', err)

    // Handle auth errors specifically
    if (isAuthError(err)) {
      await handleAuthError(err, 'MainTracker.onMounted')
      return
    }

    error.value = 'Failed to load today\'s count. Please try again.'
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

    // Handle auth errors specifically
    if (isAuthError(err)) {
      await handleAuthError(err, 'handleAddDrink')
      return // User will be redirected
    }

    // Other errors
    error.value = 'Failed to add drink. Please try again.'
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