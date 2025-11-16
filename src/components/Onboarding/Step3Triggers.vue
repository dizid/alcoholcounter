<template>
  <div class="step-content">
    <h1>What Triggers Your Drinking?</h1>
    <p class="subtitle">Understanding triggers helps AI suggest better coping strategies.</p>

    <div class="form-group">
      <label class="form-label">Common triggers (select all that apply)</label>
      <div class="checkbox-list">
        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('stress') }">
          <input type="checkbox" value="stress" v-model="localData.challenges" @change="updateStore" />
          <span>😰 Stress or anxiety</span>
        </label>

        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('peer_pressure') }">
          <input type="checkbox" value="peer_pressure" v-model="localData.challenges" @change="updateStore" />
          <span>👥 Peer pressure / Social expectations</span>
        </label>

        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('habit') }">
          <input type="checkbox" value="habit" v-model="localData.challenges" @change="updateStore" />
          <span>🔄 Habit / Daily routine</span>
        </label>

        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('emotions') }">
          <input type="checkbox" value="emotions" v-model="localData.challenges" @change="updateStore" />
          <span>💔 Difficult emotions (sadness, anger)</span>
        </label>

        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('celebration') }">
          <input type="checkbox" value="celebration" v-model="localData.challenges" @change="updateStore" />
          <span>🎉 Celebrating good news</span>
        </label>

        <label class="checkbox-item" :class="{ selected: localData.challenges.includes('boredom') }">
          <input type="checkbox" value="boredom" v-model="localData.challenges" @change="updateStore" />
          <span>😐 Boredom / Nothing to do</span>
        </label>
      </div>
      <p class="field-help">💡 AI will create personalized strategies for each trigger you select</p>
    </div>

    <div class="form-group">
      <label class="form-label">Add specific triggers (optional)</label>
      <textarea
        v-model="triggerInput"
        @keyup.enter="addCustomTrigger"
        placeholder="e.g., 'Seeing my liquor cabinet' or 'Friday evenings'"
        class="form-textarea"
        rows="3"
      ></textarea>
      <button @click="addCustomTrigger" class="btn-add" :disabled="!triggerInput.trim()">
        + Add Trigger
      </button>

      <div v-if="localData.triggers.length > 0" class="trigger-tags">
        <div v-for="(trigger, index) in localData.triggers" :key="index" class="trigger-tag">
          {{ trigger }}
          <button @click="removeTrigger(index)" class="remove-trigger">×</button>
        </div>
      </div>

      <p class="field-help">💡 The more specific, the better AI can help you develop coping plans</p>
    </div>

    <p class="skip-note">This step is optional but highly recommended for personalized advice.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOnboardingStore } from '../../stores/onboarding'

const onboardingStore = useOnboardingStore()

const localData = ref({
  triggers: [],
  challenges: []
})

const triggerInput = ref('')

function updateStore() {
  onboardingStore.updateStep3(localData.value)
}

function addCustomTrigger() {
  const trigger = triggerInput.value.trim()
  if (trigger && !localData.value.triggers.includes(trigger)) {
    localData.value.triggers.push(trigger)
    triggerInput.value = ''
    updateStore()
  }
}

function removeTrigger(index) {
  localData.value.triggers.splice(index, 1)
  updateStore()
}

onMounted(() => {
  localData.value = { ...onboardingStore.step3Data }
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

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-item:hover {
  border-color: #667eea;
  background: #f9f9f9;
}

.checkbox-item.selected {
  border-color: #667eea;
  background: #f0f7ff;
}

.form-textarea {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.btn-add {
  margin-top: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: #5568d3;
}

.btn-add:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.trigger-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.trigger-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0f7ff;
  border: 1px solid #667eea;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2c3e50;
}

.remove-trigger {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.remove-trigger:hover {
  color: #e74c3c;
}

.field-help {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #667eea;
  font-style: italic;
}

.skip-note {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 2rem;
  font-style: italic;
}
</style>
