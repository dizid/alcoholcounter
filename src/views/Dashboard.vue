<template>
  <div class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <canvas id="barChart" ref="chartRef"></canvas>
    <div class="ai-advice-section">
      <h2>Grok AI Advice</h2>
      <pulse-loader v-if="aiLoading" :color="'#4a90e2'" :size="'15px'" class="spinner" />
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <div v-else v-html="parsedAiAdvice" class="ai-advice-content"></div>
      <button v-if="aiError" @click="retryAiAdvice">Retry AI Advice</button>
    </div>
    <button @click="goToMain">Back to Tracker</button>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { marked } from 'marked'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import { getHistoricalCounts, getContextFrequencies } from '../services/db'
import { getGrokAdvice } from '../services/grok'
import { logout } from '../services/auth'

// Initialize router for navigation
const router = useRouter()

// Reactive state for chart and advice
const chartRef = ref(null)
const aiAdvice = ref('')
const aiLoading = ref(true)
const aiError = ref('')

// Parse Markdown advice for safe rendering
const parsedAiAdvice = computed(() => marked.parse(aiAdvice.value, { breaks: true }))

// Fetch data and render chart/advice
async function loadData() {
  try {
    const counts = await getHistoricalCounts(30) // Last 30 days for chart
    renderChart(counts)
    const freq = await getContextFrequencies() // Frequencies for contexts

    // Prepare summarized user data for AI
    aiLoading.value = true
    aiError.value = ''
    const userData = { historicalCounts: counts, contextFrequencies: freq }
    console.log('Sending summarized data to Grok:', userData)
    const aiResponse = await getGrokAdvice(userData)
    aiAdvice.value = aiResponse
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    aiError.value = err.message.includes('timed out')
      ? 'Unable to load AI advice due to a timeout. Please check your internet connection and try again later.'
      : `Failed to load AI advice: ${err.message}. Please try again or contact support.`
  } finally {
    aiLoading.value = false
  }
}

// Retry AI advice on button click
async function retryAiAdvice() {
  await loadData()
}

// Load data on mount
loadData()

// Render bar chart with daily counts
function renderChart(counts) {
  const labels = Object.keys(counts).sort()
  const data = labels.map(date => counts[date])

  new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Daily Drinks',
        data,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
      responsive: true,
      plugins: {
        tooltip: {
          enabled: true // Enable tooltips for better UX
        }
      }
    }
  })
}

// Navigate to main tracker
function goToMain() {
  router.push('/')
}

// Handle logout and redirect to main tracker
async function handleLogout() {
  try {
    await logout()
    router.push('/') // Redirect to main tracker; router guard handles login redirect
  } catch (err) {
    console.error('Error logging out:', err)
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
}
.ai-advice-section {
  margin-top: 1rem;
}
.ai-advice-content {
  line-height: 1.6;
  font-size: 1rem;
}
.ai-advice-content :deep(h1) {
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
}
.ai-advice-content :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
}
.error {
  color: #e74c3c;
}
.spinner {
  margin: 1rem auto;
  text-align: center;
}
button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}
</style>