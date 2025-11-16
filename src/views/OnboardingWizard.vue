<template>
  <div class="onboarding-wrapper">
    <!-- Progress Bar -->
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>

    <!-- Resume Modal -->
    <div v-if="showResumeModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Welcome Back!</h2>
        <p>Would you like to continue where you left off?</p>
        <div class="modal-actions">
          <button @click="continueOnboarding" class="btn-primary">Continue</button>
          <button @click="startFresh" class="btn-secondary">Start Fresh</button>
        </div>
      </div>
    </div>

    <!-- Wizard Container -->
    <div class="wizard-container">
      <!-- Step Indicator -->
      <div class="step-indicator">
        <span class="step-text">Step {{ currentStep }} of {{ totalSteps }}</span>
        <span class="step-progress">{{ progress }}% complete</span>
      </div>

      <!-- Step Content with Transitions -->
      <Transition name="slide" mode="out-in">
        <component
          :is="currentStepComponent"
          :key="currentStep"
          @next="handleNext"
          @back="handleBack"
        />
      </Transition>

      <!-- Navigation Buttons (if not on last step which has its own submit) -->
      <div v-if="currentStep < totalSteps" class="wizard-nav">
        <button
          v-if="currentStep > 1"
          @click="handleBack"
          class="btn-back"
        >
          ← Back
        </button>
        <button
          @click="handleNext"
          :disabled="!canProceed"
          class="btn-next"
        >
          {{ currentStep === totalSteps ? 'Finish' : 'Next →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding'

// Import step components
import Step1Welcome from '../components/Onboarding/Step1Welcome.vue'
import Step2Habits from '../components/Onboarding/Step2Habits.vue'
import Step3Triggers from '../components/Onboarding/Step3Triggers.vue'
import Step4Pricing from '../components/Onboarding/Step4Pricing.vue'
import Step5Signup from '../components/Onboarding/Step5Signup.vue'

const router = useRouter()
const onboardingStore = useOnboardingStore()

const showResumeModal = ref(false)

// Computed
const currentStep = computed(() => onboardingStore.currentStep)
const totalSteps = computed(() => onboardingStore.totalSteps)
const progress = computed(() => onboardingStore.progress)
const canProceed = computed(() => onboardingStore.canProceed)

const currentStepComponent = computed(() => {
  const steps = {
    1: Step1Welcome,
    2: Step2Habits,
    3: Step3Triggers,
    4: Step4Pricing,
    5: Step5Signup
  }
  return steps[currentStep.value] || Step1Welcome
})

// Methods
function handleNext() {
  if (canProceed.value) {
    onboardingStore.nextStep()
  }
}

function handleBack() {
  onboardingStore.previousStep()
}

function continueOnboarding() {
  showResumeModal.value = false
  // Data is already loaded, just close modal
}

function startFresh() {
  showResumeModal.value = false
  onboardingStore.reset()
}

// Lifecycle
onMounted(() => {
  // Try to load saved progress
  const hasData = onboardingStore.loadFromLocalStorage()

  // Show resume modal if we have saved data and not on first step
  if (hasData && onboardingStore.currentStep > 1) {
    showResumeModal.value = true
  }
})
</script>

<style scoped>
.onboarding-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.progress-bar-container {
  max-width: 800px;
  margin: 0 auto 2rem;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.wizard-container {
  max-width: 700px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.step-text {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
}

.step-progress {
  color: #667eea;
  font-weight: 600;
}

.wizard-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;
}

.btn-back, .btn-next {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-back {
  background: #f0f0f0;
  color: #2c3e50;
}

.btn-back:hover {
  background: #e0e0e0;
}

.btn-next {
  background: #667eea;
  color: white;
  flex: 1;
}

.btn-next:hover:not(:disabled) {
  background: #5568d3;
}

.btn-next:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-content p {
  margin-bottom: 2rem;
  color: #666;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #f0f0f0;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Slide Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .onboarding-wrapper {
    padding: 1rem;
  }

  .wizard-container {
    padding: 2rem 1.5rem;
  }

  .step-indicator {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
