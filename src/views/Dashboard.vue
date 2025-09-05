<!-- src/views/Dashboard.vue -->
<template>
  <article class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <div class="chart-wrapper">
      <canvas id="barChart" ref="chartRef"></canvas>
    </div>
    <section class="ai-advice-section">
      <h2>Grok AI Advice</h2>
      <pulse-loader v-if="aiLoading" :color="'#4a90e2'" :size="'15px'" class="spinner" />
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <div v-else v-html="parsedAiAdvice" class="ai-advice-content"></div>
      <button v-if="aiError" @click="retryAiAdvice">Retry AI Advice</button>
    </section>
    <div class="button-group">
      <button @click="goToMain">Back to Tracker</button>
      <button @click="handleLogout">Logout</button>
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

const router = useRouter()
const aiAdvice = ref('No AI advice')
const aiLoading = ref(false)
const aiError = ref('')
const chartInstance = ref(null)
const chartRef = ref(null)
const error = ref('')

async function loadData() {
  aiLoading.value = true
  aiError.value = ''
  try {
    // Gather historical drinking patterns (daily counts over last 30 days)
    const historicalCounts = await getHistoricalCounts(30)
    console.log('Historical counts data:', historicalCounts) // Debug: Check data structure

    // Render chart with historical counts, handling invalid data
    renderChart(historicalCounts)

    // Gather all user data for comprehensive advice
    const userTriggers = await getUserTriggers()
    const contextFrequencies = await getContextFrequencies()
    const userReflections = await getUserReflections()
    
    const userData = {
      triggers: userTriggers,
      historicalDrinkingPatterns: historicalCounts,
      contextFrequencies: contextFrequencies,
      reflections: userReflections,
    }

    console.log('Comprehensive user data for AI:', JSON.stringify(userData))

    const advice = await getGrokAdvice(userData)
    aiAdvice.value = advice || 'No AI advice - API may be limited or misconfigured.'
  } catch (err) {
    console.error('Load data error:', err)
    aiError.value = `Failed to load AI advice: ${err.message}. Contact support if persistent.`
  } finally {
    aiLoading.value = false
  }
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

const parsedAiAdvice = computed(() => marked(aiAdvice.value || ''));
</script>