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
    <button @click="loginWithGoogle">Login with Google</button>
    
    <p v-if="error">{{ error }}</p>
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

async function handleLogin() {
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
  }
}

async function handleSignUp() {
  try {
    await signUp(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
  }
}

async function loginWithGoogle() {
  try {
    await loginWithProvider('google')
    // Redirect handled by Supabase
  } catch (err) {
    error.value = err.message
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
</style>