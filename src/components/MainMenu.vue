<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <!-- Hamburger icon for mobile with Menu text -->
    <button class="hamburger" @click="toggleMenu" aria-label="Toggle menu">
      <span class="hamburger-icon">{{ isMenuOpen ? '✖' : '☰' }}</span>
      <span class="hamburger-text"> Menu</span>
    </button>
    
    <!-- Navigation links -->
    <ul :class="{ 'nav-links': true, 'nav-links-open': isMenuOpen }">
      <template v-if="userStore.user">
        <!-- Links shown when logged in -->
        <li><router-link to="/" class="nav-link" @click="closeMenu">Tracker</router-link></li>
        <li><router-link to="/dashboard" class="nav-link" @click="closeMenu">Dashboard</router-link></li>
        <li><router-link to="/feedback" class="nav-link" @click="closeMenu">Feedback</router-link></li>
        <li><router-link to="/about-tracker" class="nav-link" @click="closeMenu">Background</router-link></li>
        <li><button @click="handleLogout" class="nav-button">Logout</button></li>
      </template>
      <template v-else>
        <!-- Links shown when logged out -->
        <li><router-link to="/login" class="nav-link" @click="closeMenu">Login</router-link></li>
      </template>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { logout } from '../services/auth'

const router = useRouter()
const userStore = useUserStore()
const isMenuOpen = ref(false)

async function handleLogout() {
  try {
    await logout()
    router.push('/login')
  } catch (err) {
    console.error('Error logging out:', err)
  }
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value // Ensure toggle works
}

function closeMenu() {
  isMenuOpen.value = false
}
</script>