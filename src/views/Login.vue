<template>
  <!-- Container for login/signup UI -->
  <div class="login-container">
    <h1>Alcohol Support Tracker</h1>
    <p>Login or create an account to start tracking.</p>
    
    <!-- Form for email/password login -->
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    
    <!-- Buttons for signup and Google login -->
    <button @click="handleSignUp">Sign Up</button>
    <button @click="loginWithGoogle">Login with Google</button>
    
    <!-- Display error or success messages -->
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue' // Import for reactive states
import { useRouter } from 'vue-router' // Import router for navigation
import { login, signUp, loginWithProvider } from '../services/auth' // Import auth functions

// Initialize router
const router = useRouter()

// Reactive states for form and feedback
const email = ref('') // Email input
const password = ref('') // Password input
const error = ref('') // Error message
const message = ref('') // Success message (e.g., signup confirmation)

// Handler for login with email/password
async function handleLogin() {
  try {
    await login(email.value, password.value) // Authenticate via Supabase
    message.value = '' // Clear success message
    router.push('/') // Redirect to main tracker
  } catch (err) {
    error.value = err.message // Set error
    message.value = '' // Clear success
  }
}

// Handler for signup with email/password
async function handleSignUp() {
  try {
    await signUp(email.value, password.value) // Create account via Supabase
    message.value = 'Please check your email to confirm your account.' // Show confirmation
    error.value = '' // Clear error
    email.value = '' // Reset form
    password.value = ''
  } catch (err) {
    error.value = err.message // Set error
    message.value = '' // Clear success
  }
}

// Handler for Google OAuth login
async function loginWithGoogle() {
  try {
    await loginWithProvider('google') // Initiate OAuth flow
    message.value = '' // Clear success
  } catch (err) {
    error.value = err.message // Set error
    message.value = '' // Clear success
  }
}
</script>

<style scoped>
/* Scoped styles for login container */
.login-container {
  max-width: 400px; /* Limit width for mobile-friendliness */
  margin: auto; /* Center horizontally */
  padding: 1rem; /* Add padding */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
}

/* Success message style */
.success {
  color: #4a90e2; /* Blue for success */
  margin-top: 1rem;
  font-weight: bold;
}

/* Error message style */
.error {
  color: #e74c3c; /* Red for errors */
  margin-top: 1rem;
  font-weight: bold;
}
</style>