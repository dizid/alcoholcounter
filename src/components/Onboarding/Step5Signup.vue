<template>
  <div class="step-content">
    <h1>Create Your Account</h1>
    <p class="subtitle">You're one step away from tracking smarter!</p>

    <form @submit.prevent="handleSignup" class="signup-form">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input
          type="email"
          v-model="localData.email"
          @input="updateStore"
          placeholder="your@email.com"
          required
          class="form-input"
          :class="{ error: errors.email }"
        />
        <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input
          type="password"
          v-model="localData.password"
          @input="updateStore"
          placeholder="At least 6 characters"
          required
          minlength="6"
          class="form-input"
          :class="{ error: errors.password }"
        />
        <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
      </div>

      <div class="summary-box">
        <h4>Your Setup Summary:</h4>
        <div class="summary-item" v-if="step1Data.primaryGoal">
          <strong>Goal:</strong>
          {{ goalLabel }}
        </div>
        <div class="summary-item" v-if="step2Data.averageDrinksPerWeek">
          <strong>Current:</strong>
          ~{{ step2Data.averageDrinksPerWeek }} drinks/week
        </div>
        <div class="summary-item" v-if="step4Data.selectedPlan">
          <strong>Plan:</strong>
          {{ step4Data.selectedPlan === 'premium' ? 'Premium ($9/mo)' : 'Free (Forever)' }}
        </div>
      </div>

      <button
        type="submit"
        class="btn-signup"
        :disabled="loading || !canSubmit"
      >
        <span v-if="loading">Creating Account...</span>
        <span v-else>{{ step4Data.selectedPlan === 'premium' ? 'Continue to Payment' : 'Start Free' }}</span>
      </button>

      <p v-if="errors.general" class="error-message-general">{{ errors.general }}</p>

      <p class="terms">
        By creating an account, you agree to our privacy policy.
        Your data is encrypted and never shared.
      </p>
    </form>

    <p class="signin-link">
      Already have an account?
      <router-link to="/login">Sign in</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../../stores/onboarding'
import { useUserStore } from '../../stores/user'
import { supabase } from '../../supabase'
import { addUserTrigger } from '../../services/db'

const router = useRouter()
const onboardingStore = useOnboardingStore()
const userStore = useUserStore()

const localData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const errors = ref({
  email: '',
  password: '',
  general: ''
})

// Computed
const step1Data = computed(() => onboardingStore.step1Data)
const step2Data = computed(() => onboardingStore.step2Data)
const step3Data = computed(() => onboardingStore.step3Data)
const step4Data = computed(() => onboardingStore.step4Data)

const canSubmit = computed(() => {
  return localData.value.email !== '' && localData.value.password.length >= 6
})

const goalLabel = computed(() => {
  const labels = {
    reduce: 'Reduce consumption',
    track: 'Track patterns',
    recovery: 'Support recovery'
  }
  return labels[step1Data.value.primaryGoal] || ''
})

// Methods
function updateStore() {
  onboardingStore.updateStep5(localData.value)
  // Clear errors on input
  errors.value.email = ''
  errors.value.password = ''
  errors.value.general = ''
}

function validateEmail() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(localData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    return false
  }
  return true
}

async function handleSignup() {
  if (!validateEmail()) return

  loading.value = true
  errors.value.general = ''

  try {
    // Create Supabase account
    const { data, error } = await supabase.auth.signUp({
      email: localData.value.email,
      password: localData.value.password
    })

    if (error) throw error

    if (!data.user) {
      throw new Error('No user returned from signup')
    }

    console.log('User created:', data.user.id)

    // Wait a moment for subscription to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Save onboarding data to database (triggers, contexts, etc.)
    await saveOnboardingData(data.user.id)

    // Mark onboarding as complete
    onboardingStore.complete()

    // Update user store
    await userStore.setUser(data.user)

    // If premium was selected, redirect to payment
    if (step4Data.value.selectedPlan === 'premium') {
      router.push('/app?upgrade=true')
    } else {
      // Redirect to app
      router.push('/app?welcome=true')
    }

  } catch (error) {
    console.error('Signup error:', error)
    errors.value.general = error.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}

async function saveOnboardingData(userId) {
  try {
    // Save custom triggers to database
    if (step3Data.value.triggers && step3Data.value.triggers.length > 0) {
      for (const trigger of step3Data.value.triggers) {
        await addUserTrigger(trigger, null)
      }
    }

    // Save challenge triggers with generic coping strategy
    if (step3Data.value.challenges && step3Data.value.challenges.length > 0) {
      const challengeLabels = {
        stress: 'Stress or anxiety',
        peer_pressure: 'Peer pressure / Social expectations',
        habit: 'Habit / Daily routine',
        emotions: 'Difficult emotions',
        celebration: 'Celebrating good news',
        boredom: 'Boredom / Nothing to do'
      }

      for (const challenge of step3Data.value.challenges) {
        const triggerText = challengeLabels[challenge] || challenge
        await addUserTrigger(triggerText, 'Use mindfulness pause when triggered')
      }
    }

    console.log('Onboarding data saved to database')
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    // Don't throw - user is created, just log failed data save
  }
}

onMounted(() => {
  localData.value = { ...onboardingStore.step5Data }
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

.signup-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
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

.form-input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-message-general {
  color: #e74c3c;
  text-align: center;
  margin-top: 1rem;
  font-weight: 600;
}

.summary-box {
  background: #f9f9f9;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.summary-box h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.summary-item {
  margin: 0.5rem 0;
  color: #555;
}

.btn-signup {
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-signup:hover:not(:disabled) {
  background: #5568d3;
}

.btn-signup:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.terms {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 1rem;
  line-height: 1.5;
}

.signin-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.signin-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.signin-link a:hover {
  text-decoration: underline;
}
</style>
