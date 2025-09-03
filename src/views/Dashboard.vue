<template>
  <!-- Main dashboard container -->
  <article class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <!-- Wrapper for chart with fixed height for responsiveness -->
    <div class="chart-wrapper">
      <canvas id="barChart" ref="chartRef"></canvas>
    </div>
    <!-- Section for Grok AI advice -->
    <section class="ai-advice-section">
      <h2>Grok AI Advice</h2>
      <!-- Show loader during AI fetch -->
      <pulse-loader v-if="aiLoading" :color="'#4a90e2'" :size="'15px'" class="spinner" />
      <!-- Show error if AI fetch fails -->
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <!-- Render parsed Markdown advice -->
      <div v-else v-html="parsedAiAdvice" class="ai-advice-content"></div>
      <!-- Retry button on error -->
      <button v-if="aiError" @click="retryAiAdvice">Retry AI Advice</button>
    </section>
    <!-- Navigation buttons -->
    <div class="button-group">
    <button @click="goToMain">Back to Tracker</button>
    <button @click="handleLogout">Logout</button>
    </div>
    <!-- General error display -->
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { marked } from 'marked'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import { getHistoricalCounts, getContextFrequencies } from '../services/db'
import { getGrokAdvice } from '../services/grok'
import { logout } from '../services/auth'

const router = useRouter()
const chartRef = ref(null)
const chartInstance = ref(null)
const aiAdvice = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const error = ref('')

const parsedAiAdvice = computed(() => marked.parse(aiAdvice.value, { breaks: true }))

async function loadData() {
  try {
    const counts = await getHistoricalCounts(30)
    console.log('Historical counts:', counts)
    renderChart(counts)

    aiLoading.value = true
    aiError.value = ''
    error.value = ''
    const freq = await getContextFrequencies()
    console.log('Context frequencies:', freq)
    const userData = { historicalCounts: counts, contextFrequencies: freq }
    console.log('Sending summarized data to Grok:', userData)
    const aiResponse = await getGrokAdvice(userData)
    aiAdvice.value = aiResponse
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    aiError.value = err.message.includes('not found')
      ? 'AI service unavailable. Please check your connection and try again later.'
      : err.message.includes('timed out')
      ? 'Unable to load AI advice due to a timeout. Please check your internet connection and try again.'
      : err.message.includes('Empty response')
      ? 'No response from AI service. Please try again or contact support.'
      : err.message.includes('Failed to fetch')
      ? 'Unable to connect to AI service. Please check your network and try again.'
      : `Failed to load AI advice: ${err.message}. Please try again or contact support.`
  } finally {
    aiLoading.value = false
  }
}

function renderChart(counts) {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  const labels = Object.keys(counts).sort()
  const data = labels.map(date => counts[date] || 0)

  console.log('Chart labels:', labels)
  console.log('Chart data:', data)

  if (!chartRef.value) {
    console.error('Chart canvas not found')
    return
  }

  try {
    chartInstance.value = new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Daily Drinks',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        scales: { y: { beginAtZero: true } },
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { enabled: true } },
      },
    })
  } catch (chartError) {
    console.error('Error rendering chart:', chartError)
  }
}

async function retryAiAdvice() {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
  await loadData()
}

onMounted(() => {
  loadData()
})

function goToMain() {
  router.push('/')
}

async function handleLogout() {
  try {
    await logout()
    router.push('/')
    error.value = ''
  } catch (err) {
    console.error('Error logging out:', err)
    error.value = err.message
  }
}
</script>