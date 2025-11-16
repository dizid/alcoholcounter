<template>
  <div class="step-content">
    <h1>Tell Us About Your Current Habits</h1>
    <p class="subtitle">This helps us provide better insights. All fields are optional.</p>

    <div class="form-group">
      <label class="form-label">On average, how many drinks per week? (optional)</label>
      <input
        type="number"
        v-model="localData.averageDrinksPerWeek"
        @input="updateStore"
        placeholder="e.g., 10"
        min="0"
        class="form-input"
      />
      <p class="field-help">💡 Helps AI compare your progress to your baseline</p>
    </div>

    <div class="form-group">
      <label class="form-label">When do you typically drink? (select all that apply)</label>
      <div class="checkbox-grid">
        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('work_stress') }">
          <input
            type="checkbox"
            value="work_stress"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>💼 After work / Stress</span>
        </label>

        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('social') }">
          <input
            type="checkbox"
            value="social"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>👥 Social events</span>
        </label>

        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('home') }">
          <input
            type="checkbox"
            value="home"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>🏠 At home alone</span>
        </label>

        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('boredom') }">
          <input
            type="checkbox"
            value="boredom"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>😑 Boredom / Routine</span>
        </label>

        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('meals') }">
          <input
            type="checkbox"
            value="meals"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>🍽️ With meals</span>
        </label>

        <label class="checkbox-card" :class="{ selected: localData.primaryContexts.includes('weekends') }">
          <input
            type="checkbox"
            value="weekends"
            v-model="localData.primaryContexts"
            @change="updateStore"
          />
          <span>📅 Weekends</span>
        </label>
      </div>
      <p class="field-help">💡 AI will suggest coping strategies specific to these situations</p>
    </div>

    <p class="skip-note">You can skip this step and fill it in later if you prefer.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOnboardingStore } from '../../stores/onboarding'

const onboardingStore = useOnboardingStore()

const localData = ref({
  averageDrinksPerWeek: '',
  primaryContexts: []
})

function updateStore() {
  onboardingStore.updateStep2(localData.value)
}

onMounted(() => {
  localData.value = { ...onboardingStore.step2Data }
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
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.field-help {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #667eea;
  font-style: italic;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.checkbox-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-card input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-card:hover {
  border-color: #667eea;
  background: #f9f9f9;
}

.checkbox-card.selected {
  border-color: #667eea;
  background: #f0f7ff;
}

.skip-note {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 2rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}
</style>
