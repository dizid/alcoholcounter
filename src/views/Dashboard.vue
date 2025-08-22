<template>
  <div class="dashboard-container">
    <h1>Progress Dashboard</h1>
    <canvas id="barChart" ref="chartRef"></canvas>
    <div class="advice-section">
      <h2>Personalized Advice (Rule-Based)</h2>
      <p>{{ advice }}</p>
    </div>
    <div class="ai-advice-section">
      <h2>Grok AI Advice</h2>
      <p v-if="aiLoading">Loading AI advice...</p>
      <p v-else-if="aiError" class="error">{{ aiError }}</p>
      <p v-else>{{ aiAdvice }}</p>
      <button v-if="aiError" @click="retryAiAdvice">Retry AI Advice</button>
    </div>
    <button @click="goToMain">Back to Tracker</button>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { getHistoricalCounts, getContextFrequencies } from '../services/db'
import { getGrokAdvice } from '../services/grok'
import { logout } from '../services/auth'

// Initialize router for navigation
const router = useRouter()

// Reactive state for chart and advice
const chartRef = ref(null)
const advice = ref('Loading advice...')
const aiAdvice = ref('')
const aiLoading = ref(true)
const aiError = ref('')

// Fetch data and render chart/advice
async function loadData() {
  try {
    const counts = await getHistoricalCounts(30) // Last 30 days
    renderChart(counts)
    const freq = await getContextFrequencies() // Frequencies for contexts
    await generateAdvice(counts) // Rule-based advice

    // Prepare summarized user data (historical counts and context frequencies)
    aiLoading.value = true
    aiError.value = '';
    const userData = { historicalCounts: counts, contextFrequencies: freq }
    console.log('Sending summarized data to Grok:', userData); // Debug: inspect data
    const aiResponse = await getGrokAdvice(userData)
    aiAdvice.value = aiResponse;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    aiError.value = err.message.includes('timed out') 
      ? 'AI advice timed out; please try again later.' 
      : `Failed to load AI advice: ${err.message}`;
  } finally {
    aiLoading.value = false;
  }
}

// Retry AI advice on button click
async function retryAiAdvice() {
  await loadData();
}

// Load data on mount
loadData();

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
.advice-section, .ai-advice-section {
  margin-top: 1rem;
}
.error {
  color: #e74c3c;
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
