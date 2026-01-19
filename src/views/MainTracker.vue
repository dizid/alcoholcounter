<template>
  <!-- Onboarding modal for first-time users -->
  <Onboarding v-if="showOnboarding" @complete="handleOnboardingComplete" />

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
    
    <!-- Weekly goal progress (if set) -->
    <div v-if="weeklyGoal !== null" class="goal-progress-card">
      <div class="goal-header">
        <span class="goal-label">Weekly Goal</span>
        <span class="goal-value">{{ weeklyDrinkCount }}/{{ weeklyGoal }}</span>
      </div>
      <div class="goal-bar-bg">
        <div class="goal-bar-fill" :style="{ width: goalProgressPercent + '%' }" :class="{ over: weeklyDrinkCount > weeklyGoal }"></div>
      </div>
      <p class="goal-status" :class="{ success: weeklyDrinkCount <= weeklyGoal, warning: weeklyDrinkCount > weeklyGoal }">
        {{ goalStatusMessage }}
      </p>
    </div>

    <!-- Support tools section - collapsed by default for simpler UI -->
    <div class="support-section">
      <button @click="toggleSupportTools" class="support-toggle-btn" aria-expanded="showSupportTools">
        <span class="support-icon">{{ showSupportTools ? '-' : '+' }}</span>
        {{ showSupportTools ? 'Hide Support Tools' : 'Need Support?' }}
        <span v-if="streak > 0" class="streak-badge">{{ streak }} day streak</span>
      </button>

      <div v-if="showSupportTools" class="support-content">
        <p class="support-intro">Choose a tool to help manage cravings:</p>

        <!-- Quick action cards -->
        <div class="support-cards">
          <button @click="activeSupportTool = 'breathing'" :class="['support-card', { active: activeSupportTool === 'breathing' }]">
            <span class="card-icon breathing-icon">~</span>
            <span class="card-title">Breathing</span>
            <span class="card-desc">Calm your mind</span>
          </button>

          <button @click="activeSupportTool = 'urge'" :class="['support-card', { active: activeSupportTool === 'urge' }]">
            <span class="card-icon urge-icon">^</span>
            <span class="card-title">Urge Surfing</span>
            <span class="card-desc">Ride the wave</span>
          </button>

          <button @click="activeSupportTool = 'triggers'" :class="['support-card', { active: activeSupportTool === 'triggers' }]">
            <span class="card-icon trigger-icon">!</span>
            <span class="card-title">Triggers</span>
            <span class="card-desc">Know your patterns</span>
          </button>

          <button @click="activeSupportTool = 'reframe'" :class="['support-card', { active: activeSupportTool === 'reframe' }]">
            <span class="card-icon reframe-icon">?</span>
            <span class="card-title">Reframe</span>
            <span class="card-desc">Change thoughts</span>
          </button>
        </div>

        <!-- Tool content based on selection -->
        <div v-if="activeSupportTool" class="tool-content">
          <!-- Breathing Exercise -->
          <div v-if="activeSupportTool === 'breathing'" class="tool-panel">
            <h3>Breathing Exercise</h3>
            <p>Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.</p>
            <button @click="startBreathTimer" class="action-button" :disabled="isTimerRunning">
              {{ isTimerRunning ? 'Breathing...' : 'Start Timer' }}
            </button>
            <p v-if="timerDisplay && isTimerRunning" class="timer-display">{{ timerDisplay }}</p>
            <p v-if="breathFeedback" class="success">{{ breathFeedback }}</p>

            <div class="reflection-section">
              <textarea v-model="reflectionInput" placeholder="How do you feel? (optional)" rows="2"></textarea>
              <button @click="saveReflection('awareness')" class="secondary-button" :disabled="!reflectionInput">Save Reflection</button>
              <p v-if="reflectionFeedback" class="success">{{ reflectionFeedback }}</p>
            </div>
          </div>

          <!-- Urge Surfing -->
          <div v-if="activeSupportTool === 'urge'" class="tool-panel">
            <h3>Urge Surfing</h3>
            <p class="tool-explanation">Cravings are like waves - they rise, peak, and fall. Observe without acting.</p>
            <ul class="step-list">
              <li>
                <input type="checkbox" id="step1" v-model="stepsCompleted[0]" />
                <label for="step1">Notice where you feel the urge in your body</label>
              </li>
              <li>
                <input type="checkbox" id="step2" v-model="stepsCompleted[1]" />
                <label for="step2">Watch it peak and fade (1-2 minutes)</label>
              </li>
              <li>
                <input type="checkbox" id="step3" v-model="stepsCompleted[2]" />
                <label for="step3">Remind yourself: "This will pass"</label>
              </li>
            </ul>
            <p v-if="allStepsCompleted" class="success">Great job riding the wave!</p>

            <div class="reflection-section">
              <textarea v-model="reflectionInput" placeholder="How do you feel? (optional)" rows="2"></textarea>
              <button @click="saveReflection('intervention')" class="secondary-button" :disabled="!reflectionInput">Save Reflection</button>
            </div>
          </div>

          <!-- Trigger Identification -->
          <div v-if="activeSupportTool === 'triggers'" class="tool-panel">
            <h3>Identify Triggers</h3>
            <p class="tool-explanation">Understanding what triggers cravings helps you prepare healthy responses.</p>
            <form @submit.prevent="addCopingStrategy" class="trigger-form">
              <input v-model="triggerInput" placeholder="What triggered this urge?" required />
              <input v-model="copingStrategyInput" placeholder="How could you cope differently?" />
              <button type="submit" :disabled="!triggerInput" class="action-button">Save</button>
            </form>
            <p v-if="copingFeedback" class="success">{{ copingFeedback }}</p>

            <div v-if="userTriggers.length > 0" class="saved-triggers">
              <h4>Your Triggers</h4>
              <ul class="trigger-list">
                <li v-for="trig in userTriggers.slice(0, 3)" :key="trig.id">
                  <strong>{{ trig.trigger_text }}</strong>
                  <span v-if="trig.coping_strategy"> - {{ trig.coping_strategy }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Thought Reframing -->
          <div v-if="activeSupportTool === 'reframe'" class="tool-panel">
            <h3>Reframe Thoughts</h3>
            <p class="tool-explanation">Challenge unhelpful thoughts with more balanced alternatives.</p>
            <input v-model="thoughtInput" placeholder="Enter a negative thought" />
            <button @click="reframeThought" :disabled="!thoughtInput" class="action-button">Reframe</button>
            <p v-if="reframedThought" class="success reframed-thought">{{ reframedThought }}</p>

            <div class="ai-tip-section" v-if="aiTip">
              <p><strong>AI Tip:</strong> {{ aiTip }}</p>
              <button @click="fetchAiTip" class="secondary-button">Get Another Tip</button>
            </div>
          </div>
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
import { supabase } from '../supabase'
import ContextForm from '../components/ContextForm.vue'
import Onboarding from '../components/Onboarding.vue'

// Reactive state for UI
const router = useRouter()
const drinkCount = ref(0)
const showContextForm = ref(false)
const progressMessage = ref('')
const error = ref('')
const showOnboarding = ref(false)
const weeklyGoal = ref(null)

// Reactive state for support tools (progressive disclosure)
const showSupportTools = ref(false)
const activeSupportTool = ref(null)
const weeklyDrinkCount = ref(0)
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

// Reactive state for CBT tools
const triggerInput = ref('')
const copingStrategyInput = ref('')
const thoughtInput = ref('')
const copingFeedback = ref('')
const reframedThought = ref('')
const userTriggers = ref([])

// Computed for all steps completed in urge surfing
const allStepsCompleted = computed(() => stepsCompleted.value.every(step => step))

// Computed for goal progress
const goalProgressPercent = computed(() => {
  if (weeklyGoal.value === null || weeklyGoal.value === 0) return 0
  return Math.min((weeklyDrinkCount.value / weeklyGoal.value) * 100, 100)
})

const goalStatusMessage = computed(() => {
  if (weeklyGoal.value === null) return ''
  const remaining = weeklyGoal.value - weeklyDrinkCount.value
  if (remaining > 0) {
    return `${remaining} drinks left this week - you're on track!`
  } else if (remaining === 0) {
    return "You've reached your weekly goal - stay mindful!"
  } else {
    return `${Math.abs(remaining)} over your goal - tomorrow is a fresh start`
  }
})

// Computed for filtered reflections by current tool
const filteredReflections = computed(() => {
  const toolMap = { 'breathing': 'awareness', 'urge': 'intervention' }
  const exerciseType = toolMap[activeSupportTool.value] || activeSupportTool.value
  return userReflections.value.filter(refl => refl.exercise_type === exerciseType)
})

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

// Toggle support tools section visibility
function toggleSupportTools() {
  showSupportTools.value = !showSupportTools.value
  if (showSupportTools.value) {
    fetchAiTip()
    updateStreak()
    getUserReflections().then(reflections => {
      userReflections.value = reflections
    }).catch(err => {
      console.error('Error fetching reflections:', err)
      error.value = 'Failed to load reflections.'
    })
    getUserTriggers().then(triggers => {
      userTriggers.value = triggers
    }).catch(err => {
      console.error('Error fetching triggers:', err)
    })
  }
}

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

// Fetch weekly drink count for goal tracking
async function fetchWeeklyDrinkCount() {
  try {
    const counts = await getHistoricalCounts(7)
    weeklyDrinkCount.value = Object.values(counts).reduce((sum, count) => sum + count, 0)
  } catch (err) {
    console.error('Error fetching weekly count:', err)
    weeklyDrinkCount.value = 0
  }
}

// Check if user has completed onboarding
async function checkOnboardingStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Check user metadata for onboarding flag
      const hasCompletedOnboarding = user.user_metadata?.has_completed_onboarding === true
      showOnboarding.value = !hasCompletedOnboarding

      // Load user's weekly goal if set
      if (user.user_metadata?.weekly_goal !== undefined) {
        weeklyGoal.value = user.user_metadata.weekly_goal
      }
    }
  } catch (err) {
    console.error('Error checking onboarding status:', err)
    // Don't show onboarding on error - let user use app
    showOnboarding.value = false
  }
}

// Handle onboarding completion
function handleOnboardingComplete(data) {
  showOnboarding.value = false
  if (data?.goal !== null) {
    weeklyGoal.value = data.goal
  }
}

// Initialize component data
onMounted(async () => {
  try {
    // Check onboarding status first
    await checkOnboardingStatus()

    drinkCount.value = await getTodayDrinkCount()
    updateProgressMessage()

    // Fetch weekly count for goal progress
    await fetchWeeklyDrinkCount()

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