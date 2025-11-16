// Onboarding Store - Manages wizard state and localStorage persistence
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'alcohol_tracker_onboarding'
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export const useOnboardingStore = defineStore('onboarding', () => {
  // State
  const currentStep = ref(1)
  const totalSteps = 5

  // Step data
  const step1Data = ref({
    primaryGoal: '' // 'reduce', 'track', 'recovery'
  })

  const step2Data = ref({
    averageDrinksPerWeek: '',
    primaryContexts: [] // ['work_stress', 'social', 'home', 'boredom']
  })

  const step3Data = ref({
    triggers: [] // Array of trigger strings
    challenges: [] // ['peer_pressure', 'stress', 'habit', 'emotions']
  })

  const step4Data = ref({
    selectedPlan: 'free' // 'free' or 'premium'
  })

  const step5Data = ref({
    email: '',
    password: ''
  })

  // Computed
  const progress = computed(() => Math.round((currentStep.value / totalSteps) * 100))

  const isComplete = computed(() => currentStep.value > totalSteps)

  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1:
        return step1Data.value.primaryGoal !== ''
      case 2:
        // Optional step, can skip
        return true
      case 3:
        // Optional step, can skip
        return true
      case 4:
        return true // Plan selection always valid
      case 5:
        return step5Data.value.email !== '' && step5Data.value.password.length >= 6
      default:
        return false
    }
  })

  // Actions

  /**
   * Go to next step
   */
  function nextStep() {
    if (currentStep.value < totalSteps) {
      currentStep.value++
      saveToLocalStorage()
    }
  }

  /**
   * Go to previous step
   */
  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  /**
   * Go to specific step
   */
  function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step
    }
  }

  /**
   * Update step 1 data
   */
  function updateStep1(data) {
    step1Data.value = { ...step1Data.value, ...data }
    saveToLocalStorage()
  }

  /**
   * Update step 2 data
   */
  function updateStep2(data) {
    step2Data.value = { ...step2Data.value, ...data }
    saveToLocalStorage()
  }

  /**
   * Update step 3 data
   */
  function updateStep3(data) {
    step3Data.value = { ...step3Data.value, ...data }
    saveToLocalStorage()
  }

  /**
   * Update step 4 data
   */
  function updateStep4(data) {
    step4Data.value = { ...step4Data.value, ...data }
    saveToLocalStorage()
  }

  /**
   * Update step 5 data
   */
  function updateStep5(data) {
    step5Data.value = { ...step5Data.value, ...data }
    saveToLocalStorage()
  }

  /**
   * Save wizard state to localStorage with TTL
   */
  function saveToLocalStorage() {
    try {
      const data = {
        currentStep: currentStep.value,
        step1: step1Data.value,
        step2: step2Data.value,
        step3: step3Data.value,
        step4: step4Data.value,
        step5: { ...step5Data.value, password: '' }, // Don't persist password
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save onboarding to localStorage:', error)
    }
  }

  /**
   * Load wizard state from localStorage
   * @returns {boolean} True if data was loaded
   */
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const data = JSON.parse(stored)

      // Check if data is expired (older than TTL)
      const age = Date.now() - (data.timestamp || 0)
      if (age > STORAGE_TTL) {
        clearLocalStorage()
        return false
      }

      // Restore state
      currentStep.value = data.currentStep || 1
      step1Data.value = data.step1 || { primaryGoal: '' }
      step2Data.value = data.step2 || { averageDrinksPerWeek: '', primaryContexts: [] }
      step3Data.value = data.step3 || { triggers: [], challenges: [] }
      step4Data.value = data.step4 || { selectedPlan: 'free' }
      step5Data.value = {
        email: data.step5?.email || '',
        password: '' // Never restore password
      }

      console.log('Onboarding data restored from localStorage')
      return true
    } catch (error) {
      console.error('Failed to load onboarding from localStorage:', error)
      return false
    }
  }

  /**
   * Clear localStorage
   */
  function clearLocalStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear onboarding localStorage:', error)
    }
  }

  /**
   * Reset wizard to initial state
   */
  function reset() {
    currentStep.value = 1
    step1Data.value = { primaryGoal: '' }
    step2Data.value = { averageDrinksPerWeek: '', primaryContexts: [] }
    step3Data.value = { triggers: [], challenges: [] }
    step4Data.value = { selectedPlan: 'free' }
    step5Data.value = { email: '', password: '' }
    clearLocalStorage()
  }

  /**
   * Get all wizard data for creating user profile
   */
  function getAllData() {
    return {
      step1: step1Data.value,
      step2: step2Data.value,
      step3: step3Data.value,
      step4: step4Data.value,
      step5: step5Data.value
    }
  }

  /**
   * Complete onboarding (called after successful signup)
   */
  function complete() {
    currentStep.value = totalSteps + 1
    clearLocalStorage()
  }

  return {
    // State
    currentStep,
    totalSteps,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,

    // Computed
    progress,
    isComplete,
    canProceed,

    // Actions
    nextStep,
    previousStep,
    goToStep,
    updateStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    updateStep5,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    reset,
    getAllData,
    complete
  }
})
