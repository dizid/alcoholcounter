<template>
  <div class="login-container">
    <h1>Alcohol Support Tracker</h1>
    <p>Login or create an account to start tracking.</p>
    
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    
    <button @click="handleSignUp">Sign Up</button>
    <!-- unused for now: <button @click="loginWithGoogle">Login with Google</button> -->
    
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, signUp, loginWithProvider } from '../services/auth'

// Initialize router for navigation
const router = useRouter()

// Reactive state for form inputs and messages
const email = ref('')
const password = ref('')
const error = ref('')
const message = ref('') // New: For success messages like signup confirmation

// Handle login with email/password
async function handleLogin() {
  try {
    await login(email.value, password.value)
    message.value = '' // Clear success message on login attempt
    router.push('/')
  } catch (err) {
    error.value = err.message
    message.value = '' // Clear success message on error
  }
}

// Handle signup with email/password
async function handleSignUp() {
  try {
    await signUp(email.value, password.value)
    // Show confirmation message
    message.value = 'Please check your email to confirm your account.'
    error.value = '' // Clear any previous errors
    // Clear form inputs
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
    message.value = '' // Clear success message on error
  }
}

// Handle login with Google OAuth
async function loginWithGoogle() {
  try {
    await loginWithProvider('google')
    // Redirect handled by Supabase
    message.value = '' // Clear success message
  } catch (err) {
    error.value = err.message
    message.value = '' // Clear success message on error
  }
}
</script>

<style scoped>
/* Component-specific styles (global in styles.css) */
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 1rem;
}

/* Style for success message */
.success {
  color: #4a90e2;
  margin-top: 1rem;
}

/* Style for error message */
.error {
  color: #e74c3c;
  margin-top: 1rem;
}
</style>