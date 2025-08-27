<template>
  <!-- Main dashboard container -->
  <div class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <!-- Wrapper for chart with fixed height for responsiveness -->
    <div class="chart-wrapper">
      <canvas id="barChart" ref="chartRef"></canvas>
    </div>
    <!-- Section for Grok AI advice -->
    <div class="ai-advice-section">
      <h2>Grok AI Advice</h2>
      <!-- Show loader during AI fetch -->
      <pulse-loader v-if="aiLoading" :color="'#4a90e2'" :size="'15px'" class="spinner" />
      <!-- Show error if AI fetch fails -->
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <!-- Render parsed Markdown advice -->
      <div v-else v-html="parsedAiAdvice" class="ai-advice-content"></div>
      <!-- Retry button on error -->
      <button v-if="aiError" @click="retryAiAdvice">Retry AI Advice</button>
    </div>
    <!-- Navigation buttons -->
    <button @click="goToMain">Back to Tracker</button>
    <button @click="handleLogout">Logout</button>
    <!-- General error display -->
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue' // Vue utilities for state and lifecycle
import { useRouter } from 'vue-router' // Router for navigation
import Chart from 'chart.js/auto' // Chart.js for bar graph
import { marked } from 'marked' // Markdown parser for AI response
import PulseLoader from 'vue-spinner/src/PulseLoader.vue' // Spinner component
import { getHistoricalCounts, getContextFrequencies } from '../services/db' // DB queries
import { getGrokAdvice } from '../services/grok' // Grok AI service
import { logout } from '../services/auth' // Auth logout

// Initialize router
const router = useRouter()

// Reactive states for chart, AI, and errors
const chartRef = ref(null) // Reference to canvas element
const chartInstance = ref(null) // Chart.js instance for destruction
const aiAdvice = ref('') // Raw AI response
const aiLoading = ref(false) // Loading state for AI
const aiError = ref('') // AI-specific error
const error = ref('') // General error

// Computed property to parse Markdown safely
const parsedAiAdvice = computed(() => marked.parse(aiAdvice.value, { breaks: true }))

// Function to load all dashboard data (chart + AI)
async function loadData() {
  try {
    // Fetch and render chart data
    const counts = await getHistoricalCounts(30) // Get last 30 days counts
    console.log('Historical counts:', counts)
    renderChart(counts) // Render bar chart

    // Fetch AI advice
    aiLoading.value = true // Start loading
    aiError.value = '' // Clear previous AI error
    error.value = '' // Clear general error
    const freq = await getContextFrequencies() // Get context stats
    console.log('Context frequencies:', freq)
    const userData = { historicalCounts: counts, contextFrequencies: freq } // Prepare data for Grok
    console.log('Sending summarized data to Grok:', userData)
    const aiResponse = await getGrokAdvice(userData) // Call Grok via proxy
    aiAdvice.value = aiResponse // Set response
  } catch (err) {
    console.error('Error loading dashboard data:', err) // Log error
    // Set user-friendly AI error based on type
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
    aiLoading.value = false // End loading
  }
}

// Helper function to render bar chart
function renderChart(counts) {
  if (chartInstance.value) {
    chartInstance.value.destroy() // Destroy previous instance to avoid overlaps
    chartInstance.value = null
  }

  const labels = Object.keys(counts).sort() // Sort dates for chronological order
  const data = labels.map(date => counts[date] || 0) // Map counts, default to 0

  console.log('Chart labels:', labels)
  console.log('Chart data:', data)

  if (!chartRef.value) {
    console.error('Chart canvas not found') // Log if ref missing
    return
  }

  try {
    // Create new Chart.js instance
    chartInstance.value = new Chart(chartRef.value, {
      type: 'bar', // Bar chart type
      data: {
        labels,
        datasets: [{
          label: 'Daily Drinks', // Dataset label
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill color
          borderColor: 'rgba(75, 192, 192, 1)', // Border color
          borderWidth: 1, // Border width
        }],
      },
      options: {
        scales: { y: { beginAtZero: true } }, // Y-axis starts at 0
        responsive: true, // Responsive to container size
        maintainAspectRatio: false, // Allow custom aspect
        plugins: { tooltip: { enabled: true } }, // Enable tooltips
      },
    })
  } catch (chartError) {
    console.error('Error rendering chart:', chartError) // Log chart errors
  }
}

// Handler to retry AI advice (resets chart if needed)
async function retryAiAdvice() {
  if (chartInstance.value) {
    chartInstance.value.destroy() // Clean up chart
    chartInstance.value = null
  }
  await loadData() // Reload data
}

// Lifecycle hook: Load data on component mount
onMounted(() => {
  loadData()
})

// Navigation handler: Back to main tracker
function goToMain() {
  router.push('/')
}

// Logout handler
async function handleLogout() {
  try {
    await logout() // Call auth logout
    router.push('/') // Redirect
    error.value = '' // Clear error
  } catch (err) {
    console.error('Error logging out:', err)
    error.value = err.message // Set error
  }
}
</script>

<style scoped>
/* Scoped styles for dashboard */
.dashboard-container {
  padding: 1rem; /* Padding for content */
  text-align: center; /* Center text */
}

/* Chart wrapper for fixed height and responsiveness */
.chart-wrapper {
  width: 100%; /* Full width */
  max-width: calc(100vw - 2rem); /* Account for padding */
  height: 300px; /* Fixed height for consistency */
  margin: 1rem 0; /* Vertical spacing */
}

/* Ensure canvas fills wrapper */
.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}

/* AI advice section styles */
.ai-advice-section {
  margin-top: 1rem; /* Space above */
  padding: 1rem; /* Internal padding */
  border: 1px solid #ddd; /* Subtle border */
  border-radius: 8px; /* Rounded corners */
}

/* Parsed AI content styles */
.ai-advice-content {
  line-height: 1.6; /* Improved readability */
  font-size: 1rem; /* Base font size */
  text-align: left; /* Left-align for text content */
}

/* Deep selector for headings in parsed content */
.ai-advice-content :deep(h1) {
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
}

/* Deep selector for lists */
.ai-advice-content :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
}

/* Error styles */
.error {
  color: #e74c3c; /* Red */
  margin-top: 1rem;
  font-weight: bold;
}

/* Spinner centering */
.spinner {
  margin: 1rem auto;
  text-align: center;
}

/* Button styles */
button {
  background: #4a90e2; /* Blue background */
  color: white; /* White text */
  border: none; /* No border */
  padding: 0.5rem 1rem; /* Padding */
  margin: 0.5rem; /* Spacing */
  cursor: pointer; /* Pointer cursor */
  border-radius: 4px; /* Rounded */
  transition: background 0.3s; /* Hover transition */
}

/* Button hover effect */
button:hover {
  background: #357abd; /* Darker blue on hover */
}
</style>