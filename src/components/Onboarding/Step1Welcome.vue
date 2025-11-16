<template>
  <div class="step-content">
    <h1>Welcome to Daily Drink Tracker</h1>
    <p class="subtitle">Let's personalize your experience. This takes just 2 minutes.</p>

    <div class="info-box">
      <p><strong>💡 Why we ask these questions:</strong></p>
      <p>The more you share, the better your AI insights become. Our AI analyzes YOUR patterns to give personalized advice – not generic tips.</p>
    </div>

    <div class="form-group">
      <label class="form-label">What's your primary goal?</label>
      <div class="radio-cards">
        <label class="radio-card" :class="{ selected: localData.primaryGoal === 'reduce' }">
          <input
            type="radio"
            value="reduce"
            v-model="localData.primaryGoal"
            @change="updateStore"
          />
          <div class="radio-card-content">
            <div class="radio-icon">📉</div>
            <h3>Reduce Consumption</h3>
            <p>I want to drink less than I currently do</p>
          </div>
        </label>

        <label class="radio-card" :class="{ selected: localData.primaryGoal === 'track' }">
          <input
            type="radio"
            value="track"
            v-model="localData.primaryGoal"
            @change="updateStore"
          />
          <div class="radio-card-content">
            <div class="radio-icon">📊</div>
            <h3>Track Patterns</h3>
            <p>I want to understand my drinking habits better</p>
          </div>
        </label>

        <label class="radio-card" :class="{ selected: localData.primaryGoal === 'recovery' }">
          <input
            type="radio"
            value="recovery"
            v-model="localData.primaryGoal"
            @change="updateStore"
          />
          <div class="radio-card-content">
            <div class="radio-icon">🎯</div>
            <h3>Support Recovery</h3>
            <p>I'm in recovery and want ongoing support</p>
          </div>
        </label>
      </div>
    </div>

    <p class="privacy-note">🔒 Your data is encrypted and never shared. Completely private.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOnboardingStore } from '../../stores/onboarding'

const onboardingStore = useOnboardingStore()

const localData = ref({
  primaryGoal: ''
})

function updateStore() {
  onboardingStore.updateStep1(localData.value)
}

onMounted(() => {
  // Load existing data if any
  localData.value = { ...onboardingStore.step1Data }
})
</script>

<style scoped>
.step-content {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.info-box {
  background: #f0f7ff;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 8px;
}

.info-box p {
  margin: 0.5rem 0;
  line-height: 1.6;
  color: #555;
}

.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.radio-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.radio-card input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.radio-card.selected {
  border-color: #667eea;
  background: #f0f7ff;
}

.radio-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.radio-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.radio-card h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.radio-card p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.privacy-note {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
  }

  .radio-card-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
