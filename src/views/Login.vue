<template>
  <!-- Container for login/signup UI -->
  <div class="container">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, signUp, loginWithProvider } from '../services/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const message = ref('')

async function handleLogin() {
  try {
    await login(email.value, password.value)
    message.value = ''
    router.push('/')
  } catch (err) {
    error.value = err.message
    message.value = ''
  }
}

async function handleSignUp() {
  try {
    await signUp(email.value, password.value)
    message.value = 'Please check your email to confirm your account.'
    error.value = ''
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
    message.value = ''
  }
}

async function loginWithGoogle() {
  try {
    await loginWithProvider('google')
    message.value = ''
  } catch (err) {
    error.value = err.message
    message.value = ''
  }
}
</script>