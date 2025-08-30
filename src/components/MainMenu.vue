<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <!-- Hamburger icon for mobile with Menu text -->
    <button class="hamburger" @click="toggleMenu" aria-label="Toggle menu">
      <span class="hamburger-icon">{{ isMenuOpen ? '✖' : '☰' }}</span>
      <span class="hamburger-text">Menu</span>
    </button>
    
    <!-- Navigation links -->
    <ul :class="{ 'nav-links': true, 'nav-links-open': isMenuOpen }">
      <li><router-link to="/" class="nav-link" @click="closeMenu">Tracker</router-link></li>
      <li><router-link to="/dashboard" class="nav-link" @click="closeMenu">Dashboard</router-link></li>
      <li><router-link to="/about" class="nav-link" @click="closeMenu">About</router-link></li>
      <li><router-link to="/feedback" class="nav-link" @click="closeMenu">Feedback</router-link></li>
      <li><router-link to="/references" class="nav-link" @click="closeMenu">References</router-link></li>
      <li><button @click="handleLogout" class="nav-button">Logout</button></li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../services/auth'

const router = useRouter()
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