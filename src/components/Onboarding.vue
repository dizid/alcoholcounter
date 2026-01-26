<template>
  <div class="onboarding-overlay">
    <div class="onboarding-modal">
      <!-- Progress indicator -->
      <div class="progress-dots">
        <span
          v-for="i in 3"
          :key="i"
          :class="['dot', { active: currentStep === i, completed: currentStep > i }]"
        ></span>
      </div>

      <!-- Step 1: Welcome -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-icon">
          <span class="icon-circle">1</span>
        </div>
        <h2>Welcome to DrinkTracker</h2>
        <p class="step-description">
          You're taking an important step toward mindful drinking. This app helps you:
        </p>
        <ul class="benefit-list">
          <li><strong>Track</strong> your drinks with context (where, when, why)</li>
          <li><strong>Understand</strong> your patterns and triggers</li>
          <li><strong>Build</strong> healthier habits with proven techniques</li>
        </ul>
        <p class="encouragement">No judgment, just support on your journey.</p>
      </div>

      <!-- Step 2: Features Overview -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="step-icon">
          <span class="icon-circle">2</span>
        </div>
        <h2>Your Tools</h2>
        <p class="step-description">Here's what you can do:</p>

        <div class="feature-cards">
          <div class="feature-card">
            <span class="feature-icon tracker-icon">+</span>
            <h3>Drink Tracker</h3>
            <p>Log each drink with context to spot patterns</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon mindfulness-icon">~</span>
            <h3>Mindful Pause</h3>
            <p>Breathing exercises and urge surfing when cravings hit</p>
          </div>

          <div class="feature-card">
            <span class="feature-icon cbt-icon">?</span>
            <h3>CBT Strategies</h3>
            <p>Identify triggers and reframe thoughts</p>
          </div>
        </div>

        <p class="tip">Tip: Start simple - just track your drinks. Explore other tools when you're ready.</p>
      </div>

      <!-- Step 3: Set Initial Goal -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="step-icon">
          <span class="icon-circle">3</span>
        </div>
        <h2>Set Your Weekly Goal</h2>
        <p class="step-description">
          How many drinks per week feels right for you? You can change this anytime.
        </p>

        <div class="goal-selector">
          <button
            v-for="option in goalOptions"
            :key="option.value"
            :class="['goal-option', { selected: selectedGoal === option.value }]"
            @click="selectedGoal = option.value"
          >
            <span class="goal-number">{{ option.label }}</span>
            <span class="goal-desc">{{ option.description }}</span>
          </button>
        </div>

        <label class="skip-goal">
          <input type="checkbox" v-model="skipGoal" />
          Skip for now - I'll set a goal later
        </label>
      </div>

      <!-- Navigation buttons -->
      <div class="onboarding-nav">
        <button
          v-if="currentStep > 1"
          @click="previousStep"
          class="nav-btn secondary"
        >
          Back
        </button>
        <button
          v-if="currentStep < 3"
          @click="nextStep"
          class="nav-btn primary"
        >
          Next
        </button>
        <button
          v-if="currentStep === 3"
          @click="completeOnboarding"
          class="nav-btn primary"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Get Started' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const emit = defineEmits(['complete'])

const currentStep = ref(1)
const selectedGoal = ref(14)
const skipGoal = ref(false)
const saving = ref(false)

// Goal options with descriptions
const goalOptions = [
  { value: 7, label: '7', description: '1 per day' },
  { value: 14, label: '14', description: '2 per day' },
  { value: 21, label: '21', description: '3 per day' },
  { value: 0, label: '0', description: 'Alcohol-free' }
]

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function completeOnboarding() {
  saving.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Save onboarding completion and goal (if set)
      const goalValue = skipGoal.value ? null : selectedGoal.value

      // Update user metadata to mark onboarding as complete
      await supabase.auth.updateUser({
        data: {
          has_completed_onboarding: true,
          weekly_goal: goalValue
        }
      })

      // If goal was set, also save to user_goals table (will be created later)
      if (goalValue !== null) {
        await supabase.from('user_goals').upsert({
          user_id: user.id,
          weekly_limit: goalValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      }
    }

    // Emit completion event
    emit('complete', { goal: skipGoal.value ? null : selectedGoal.value })
  } catch (err) {
    console.error('Error completing onboarding:', err)
    // Still emit complete even if save fails - don't block the user
    emit('complete', { goal: skipGoal.value ? null : selectedGoal.value })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.onboarding-modal {
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress dots */
.progress-dots {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s ease;
}

.dot.active {
  background: #3498db;
  transform: scale(1.2);
}

.dot.completed {
  background: #2ecc71;
}

/* Step content */
.step-content {
  text-align: center;
  min-height: 300px;
}

.step-icon {
  margin-bottom: 1rem;
}

.icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.step-content h2 {
  color: #2c3e50;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.step-description {
  color: #7f8c8d;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

/* Benefit list (Step 1) */
.benefit-list {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.benefit-list li {
  padding: 0.75rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #333;
  border-bottom: 1px solid #eee;
}

.benefit-list li:last-child {
  border-bottom: none;
}

.benefit-list li::before {
  content: '>';
  position: absolute;
  left: 0;
  color: #2ecc71;
  font-weight: bold;
}

.encouragement {
  color: #2ecc71;
  font-weight: 500;
  font-style: italic;
}

/* Feature cards (Step 2) */
.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: bold;
  flex-shrink: 0;
}

.tracker-icon {
  background: #2ecc71;
  color: white;
}

.mindfulness-icon {
  background: #9b59b6;
  color: white;
}

.cbt-icon {
  background: #3498db;
  color: white;
}

.feature-card h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #2c3e50;
}

.feature-card p {
  margin: 0;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.tip {
  font-size: 0.875rem;
  color: #7f8c8d;
  background: #fff9e6;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 3px solid #f1c40f;
}

/* Goal selector (Step 3) */
.goal-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.goal-option {
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.goal-option:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.goal-option.selected {
  border-color: #2ecc71;
  background: #e8f8f0;
}

.goal-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.goal-desc {
  display: block;
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
}

.skip-goal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7f8c8d;
  cursor: pointer;
}

.skip-goal input {
  width: auto;
  margin: 0;
}

/* Navigation buttons */
.onboarding-nav {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.nav-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn.primary {
  background: #2ecc71;
  color: white;
}

.nav-btn.primary:hover {
  background: #27ae60;
}

.nav-btn.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.nav-btn.secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.nav-btn.secondary:hover {
  background: #e9ecef;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .onboarding-modal {
    padding: 1.5rem;
    margin: 0.5rem;
  }

  .step-content {
    min-height: 280px;
  }

  .step-content h2 {
    font-size: 1.25rem;
  }

  .goal-selector {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .goal-option {
    padding: 0.75rem;
  }

  .goal-number {
    font-size: 1.25rem;
  }
}
</style>
