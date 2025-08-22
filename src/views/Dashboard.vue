<template>
  <div class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <canvas id="barChart" ref="chartRef"></canvas>
    <div class="advice-section">
      <h2>Personalized Advice</h2>
      <p>{{ advice }}</p>
    </div>
    <button @click="goToMain">Back to Tracker</button>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { getHistoricalCounts, getContextFrequencies } from '../services/db'
import { logout } from '../services/auth'

// Initialize router for navigation
const router = useRouter()

// Reactive state for chart and advice
const chartRef = ref(null)
const advice = ref('Loading advice...')

// Fetch data and render chart/advice on mount
onMounted(async () => {
  try {
    const counts = await getHistoricalCounts(30) // Last 30 days
    renderChart(counts)
    generateAdvice(counts)
  } catch (err) {
    console.error('Error loading dashboard data:', err)
  }
})

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
      responsive: true
    }
  })
}

// Generate personalized advice based on data (rule-based "AI")
async function generateAdvice(counts) {
  try {
    const totalDrinks = Object.values(counts).reduce((a, b) => a + b, 0)
    const avgDaily = totalDrinks / 30
    const freq = await getContextFrequencies()

    let tips = []
    if (avgDaily > 5) tips.push('Your average is high – consider setting a daily limit.')
    if (freq.company['Alone'] > freq.company['With friends']) tips.push('Drinking alone more often? Try social settings for support.')
    if (freq.mood['negative'] > freq.mood['positive']) tips.push('Negative moods linked to drinks? Explore alternatives like exercise.')
    if (totalDrinks === 0) tips.push('Amazing zero-drink streak! Keep building healthy habits.')

    advice.value = tips.join(' ') + ' Stay motivated – you’ve got this!'
  } catch (err) {
    console.error('Error generating advice:', err)
    advice.value = 'Unable to load advice at this time.'
  }
}

// Navigate to main tracker
function goToMain() {
  router.push('/')
}

// Handle logout and redirect to main tracker
async function handleLogout() {
  try {
    await logout()
    router.push('/') // Redirect to main tracker; router guard handles login redirect if needed
  } catch (err) {
    console.error('Error logging out:', err)
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
}
.advice-section {
  margin-top: 1rem;
}
</style>