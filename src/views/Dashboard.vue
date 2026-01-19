<!-- src/views/Dashboard.vue -->
<template>
  <article class="dashboard-container">
    <h1>Progress Dashboard</h1>

    <!-- Quick Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ totalDrinksThisWeek }}</span>
        <span class="stat-label">This Week</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ averageDailyDrinks.toFixed(1) }}</span>
        <span class="stat-label">Daily Avg</span>
      </div>
      <div class="stat-card" :class="{ positive: weeklyChange < 0, neutral: weeklyChange === 0 }">
        <span class="stat-value">{{ weeklyChange > 0 ? '+' : '' }}{{ weeklyChange }}%</span>
        <span class="stat-label">vs Last Week</span>
      </div>
    </div>

    <!-- Goal Progress (if set) -->
    <div v-if="weeklyGoal !== null" class="goal-card">
      <div class="goal-header-row">
        <span>Weekly Goal Progress</span>
        <span class="goal-numbers">{{ totalDrinksThisWeek }}/{{ weeklyGoal }}</span>
      </div>
      <div class="goal-bar-container">
        <div class="goal-bar-bg">
          <div
            class="goal-bar-fill"
            :style="{ width: goalProgressPercent + '%' }"
            :class="{ over: totalDrinksThisWeek > weeklyGoal }"
          ></div>
        </div>
      </div>
      <p class="goal-message" :class="{ success: totalDrinksThisWeek <= weeklyGoal }">
        {{ goalMessage }}
      </p>
    </div>

    <!-- Day of Week Insights -->
    <div class="insights-card">
      <h3>Your Patterns</h3>
      <div class="day-bars">
        <div v-for="(count, day) in dayOfWeekData" :key="day" class="day-bar-item">
          <div class="day-bar-fill" :style="{ height: getDayBarHeight(count) + '%' }"></div>
          <span class="day-label">{{ day }}</span>
        </div>
      </div>
      <p v-if="peakDay" class="insight-text">
        You tend to drink more on <strong>{{ peakDay }}</strong>s. Plan ahead for these days.
      </p>
    </div>

    <!-- 30-Day Chart -->
    <div class="chart-wrapper">
      <h3>Last 30 Days</h3>
      <canvas id="barChart" ref="chartRef"></canvas>
    </div>

    <!-- Achievements -->
    <Achievements
      :tracking-streak="trackingStreak"
      :mindfulness-streak="mindfulnessStreak"
      :total-reflections="totalReflections"
      :goals-met-count="goalsMetCount"
    />

    <!-- AI Advice Section -->
    <section class="ai-advice-section">
      <h2>Personalized Insights</h2>
      <pulse-loader v-if="aiLoading" :color="'#4a90e2'" :size="'15px'" class="spinner" />
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <div v-else v-html="parsedAiAdvice" class="ai-advice-content"></div>
      <button v-if="aiError" @click="retryAiAdvice" class="retry-btn">Retry</button>
    </section>

    <div class="button-group">
      <button @click="goToMain">Back to Tracker</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { marked } from 'marked'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import { getHistoricalCounts, getContextFrequencies, getUserTriggers, getUserReflections } from '../services/db'
import { getGrokAdvice } from '../services/grok'
import { logout } from '../services/auth'
import { isAuthError, handleAuthError } from '../services/authErrorHandler'
import { supabase } from '../supabase'
import Achievements from '../components/Achievements.vue'

const router = useRouter()
const aiAdvice = ref('No AI advice')
const aiLoading = ref(false)
const aiError = ref('')
const chartInstance = ref(null)
const chartRef = ref(null)
const error = ref('')

// Stats data
const totalDrinksThisWeek = ref(0)
const totalDrinksLastWeek = ref(0)
const averageDailyDrinks = ref(0)
const weeklyGoal = ref(null)
const dayOfWeekData = ref({ Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 })
const trackingStreak = ref(0)
const mindfulnessStreak = ref(0)
const totalReflections = ref(0)
const goalsMetCount = ref(0)

// Computed properties
const weeklyChange = computed(() => {
  if (totalDrinksLastWeek.value === 0) return 0
  return Math.round(((totalDrinksThisWeek.value - totalDrinksLastWeek.value) / totalDrinksLastWeek.value) * 100)
})

const goalProgressPercent = computed(() => {
  if (weeklyGoal.value === null || weeklyGoal.value === 0) return 0
  return Math.min((totalDrinksThisWeek.value / weeklyGoal.value) * 100, 100)
})

const goalMessage = computed(() => {
  if (weeklyGoal.value === null) return ''
  const remaining = weeklyGoal.value - totalDrinksThisWeek.value
  if (remaining > 0) return `${remaining} drinks remaining - keep going!`
  if (remaining === 0) return "Goal reached - stay mindful!"
  return "Over goal - tomorrow's a new day"
})

const peakDay = computed(() => {
  const maxCount = Math.max(...Object.values(dayOfWeekData.value))
  if (maxCount === 0) return null
  const dayNames = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }
  const peak = Object.entries(dayOfWeekData.value).find(([_, count]) => count === maxCount)
  return peak ? dayNames[peak[0]] : null
})

function getDayBarHeight(count) {
  const maxCount = Math.max(...Object.values(dayOfWeekData.value), 1)
  return (count / maxCount) * 100
}

async function loadData() {
  aiLoading.value = true
  aiError.value = ''
  try {
    // Load user settings (goal)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.weekly_goal !== undefined) {
      weeklyGoal.value = user.user_metadata.weekly_goal
    }

    // Gather historical drinking patterns (daily counts over last 30 days)
    const historicalCounts = await getHistoricalCounts(30)

    // Calculate stats from historical data
    calculateStats(historicalCounts)

    // Render chart with historical counts
    renderChart(historicalCounts)

    // Gather all user data for comprehensive advice
    const userTriggers = await getUserTriggers()
    const contextFrequencies = await getContextFrequencies()
    const userReflections = await getUserReflections()

    // Update reflection count for achievements
    totalReflections.value = userReflections?.length || 0

    // Calculate tracking streak
    trackingStreak.value = calculateTrackingStreak(historicalCounts)

    // Get mindfulness streak from localStorage
    mindfulnessStreak.value = parseInt(localStorage.getItem('mindfulnessStreak') || '0')

    const userData = {
      triggers: userTriggers,
      historicalDrinkingPatterns: historicalCounts,
      contextFrequencies: contextFrequencies,
      reflections: userReflections,
    }

    const advice = await getGrokAdvice(userData)
    aiAdvice.value = advice || 'No personalized insights yet - keep tracking!'
  } catch (err) {
    console.error('Load data error:', err)

    // Handle auth errors specifically
    if (isAuthError(err)) {
      await handleAuthError(err, 'Dashboard.loadData')
      return
    }

    aiError.value = `Failed to load data: ${err.message}`
  } finally {
    aiLoading.value = false
  }
}

// Calculate stats from historical data
function calculateStats(counts) {
  const today = new Date()
  let thisWeekTotal = 0
  let lastWeekTotal = 0
  let totalDrinks = 0
  const dayTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Process each date in the counts
  Object.entries(counts).forEach(([dateStr, count]) => {
    const date = new Date(dateStr)
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24))

    // This week (0-6 days ago)
    if (daysDiff >= 0 && daysDiff < 7) {
      thisWeekTotal += count
    }
    // Last week (7-13 days ago)
    if (daysDiff >= 7 && daysDiff < 14) {
      lastWeekTotal += count
    }

    // Day of week totals
    const dayIndex = date.getDay()
    dayTotals[dayNames[dayIndex]] += count

    totalDrinks += count
  })

  totalDrinksThisWeek.value = thisWeekTotal
  totalDrinksLastWeek.value = lastWeekTotal
  averageDailyDrinks.value = totalDrinks / 30
  dayOfWeekData.value = dayTotals
}

// Calculate tracking streak (consecutive days with logged data)
function calculateTrackingStreak(counts) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    // Check if there's data for this date (even 0 counts mean they tracked)
    if (counts[dateStr] !== undefined) {
      streak++
    } else if (i > 0) {
      // Allow today to be missing (user hasn't logged yet today)
      break
    }
  }

  return streak
}

// Enhanced renderChart function to handle and debug counts
function renderChart(counts) {
  if (chartInstance.value) {
    chartInstance.value.destroy() // Destroy existing chart instance to prevent memory leaks
    chartInstance.value = null
  }

  // Convert counts to a sorted array if it's an object (date: count)
  let validCounts = Array.isArray(counts) ? counts : []
  if (typeof counts === 'object' && counts !== null && !Array.isArray(counts)) {
    validCounts = Object.entries(counts)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, count]) => ({ date, count }))
    console.log('Converted object to array:', validCounts) // Debug: Verify conversion
  }
  console.log('Valid counts for chart:', validCounts) // Debug: Verify data

  // Aggregate drink counts by date from timestamps or objects
  const countByDate = {}
  validCounts.forEach(item => {
    let date
    let count = 0
    if (item && item.date) {
      date = item.date
      count = item.count || 0
    } else if (item && item.created_at) {
      date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      count = 1 // Default count if no specific count field
    }
    if (date) {
      countByDate[date] = (countByDate[date] || 0) + count
    }
  })
  console.log('Aggregated counts by date:', countByDate) // Debug: Verify aggregation

  // Prepare data for the bar chart (last 30 days)
  const today = new Date()
  const labels = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (29 - index)) // Last 30 days
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  const data = labels.map(label => countByDate[label] || 0) // Use aggregated counts or zero

  // Detailed debug for empty or zero data
  console.log('Chart data:', data) // Debug: Verify final data array
  if (data.every(count => count === 0)) {
    console.warn('No non-zero drink counts found, chart will show zeros. Check historicalCounts data.')
  }

  // Create the bar chart using Chart.js with visible bars
  chartInstance.value = new Chart(chartRef.value, {
    type: 'bar', // Bar chart for daily drinks
    data: {
      labels: labels, // X-axis: dates
      datasets: [{
        label: 'Daily Drinks',
        data: data, // Y-axis: drink counts
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Light teal with transparency
        borderColor: 'rgba(75, 192, 192, 1)', // Solid teal border
        borderWidth: 1,
        barThickness: 10, // Ensure bars are visible by setting thickness
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true, // Start Y-axis at 0
          title: {
            display: true,
            text: 'Number of Drinks'
          },
          ticks: {
            stepSize: 1 // Ensure small increments for visibility
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      responsive: true, // Adjust size based on container
      maintainAspectRatio: false, // Allow custom sizing
      plugins: {
        legend: {
          display: true // Ensure legend is visible
        }
      }
    }
  })
}

async function retryAiAdvice() {
  aiError.value = ''
  await loadData()
}

onMounted(() => {
  loadData()
})

function goToMain() {
  router.push('/')
}

const parsedAiAdvice = computed(() => marked(aiAdvice.value || ''));
</script>