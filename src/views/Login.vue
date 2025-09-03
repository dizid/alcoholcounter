<!-- Login.vue -->
<template>
  <!-- Container for login/signup UI -->
  <div class="container">
    <h1>Alcohol Support Tracker</h1>
    <p>Login or create an account to start tracking.</p>
    
    <!-- Form for email/password login -->
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="isLoading">Login</button>
    </form>
    
  <!-- Buttons for signup and Google login -->

   <button @click="handleSignUp" :disabled="isLoading">Sign Up</button>
   <!--   <button class="google-button" @click="loginWithGoogle" :disabled="isLoading">
      <svg class="google-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
      </svg>
      <span v-if="isLoading && isGoogleLoading" class="spinner">Loading...</span>
      <span v-else>Login with Google</span>
    </button> -->
    
    <!-- Display error or success messages -->
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, signUp, loginWithProvider } from '../services/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const message = ref('')
const isLoading = ref(false) // Track loading state for buttons
const isGoogleLoading = ref(false) // Track Google login loading state

async function handleLogin() {
  isLoading.value = true // Disable buttons during login
  try {
    await login(email.value, password.value)
    message.value = ''
    router.push('/')
  } catch (err) {
    error.value = err.message
    message.value = ''
  } finally {
    isLoading.value = false // Re-enable buttons
  }
}

async function handleSignUp() {
  isLoading.value = true // Disable buttons during signup
  try {
    await signUp(email.value, password.value)
    message.value = 'Please check your email to confirm your account.'
    error.value = ''
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
    message.value = ''
  } finally {
    isLoading.value = false // Re-enable buttons
  }
}

async function loginWithGoogle() {
  isLoading.value = true // Disable buttons
  isGoogleLoading.value = true // Show spinner for Google button
  try {
    await loginWithProvider('google')
    message.value = ''
    router.push('/') // Redirect to tracker after successful login
  } catch (err) {
    error.value = err.message || 'Failed to login with Google.'
    message.value = ''
  } finally {
    isLoading.value = false
    isGoogleLoading.value = false
  }
}
</script>

<style scoped>
/* Scoped styles for Login.vue to enhance Google button appearance */

/* Style the Google login button */
.google-button {
  background-color: #ffffff; /* White background for Google */
  color: #333; /* Dark text for contrast */
  border: 1px solid #ddd; /* Subtle border */
  display: flex; /* Align spinner and text */
  align-items: center;
  justify-content: center;
  gap: 0.5rem; /* Space between spinner and text */
}

/* Hover effect for Google button */
.google-button:hover {
  background-color: #f1f1f1; /* Light grey on hover */
}

/* Spinner animation for loading state */
.spinner {
  animation: spin 1s linear infinite;
}

/* Keyframes for spinner animation */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>