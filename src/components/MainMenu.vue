<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <!-- Hamburger icon for mobile -->
    <button class="hamburger" @click="toggleMenu" aria-label="Toggle menu">
      <span class="hamburger-icon">{{ isMenuOpen ? '✖' : '☰' }}</span>
    </button>
    
    <!-- Navigation links -->
    <div :class="{ 'nav-links': true, 'nav-links-open': isMenuOpen }">
      <router-link to="/" class="nav-link" @click="closeMenu">Tracker</router-link>
      <router-link to="/dashboard" class="nav-link" @click="closeMenu">Dashboard</router-link>
      <router-link to="/about" class="nav-link" @click="closeMenu">About</router-link>
      <router-link to="/feedback" class="nav-link" @click="closeMenu">Feedback</router-link>
      <router-link to="/references" class="nav-link" @click="closeMenu">References</router-link>
      <button @click="handleLogout" class="nav-button">Logout</button>
    </div>
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
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<style scoped>
.main-menu {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #4a90e2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-link:hover {
  background-color: #357abd;
}

.nav-button {
  background: none;
  border: none;
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-button:hover {
  background-color: #357abd;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger-icon {
  line-height: 1;
}

/* Mobile styles */
@media (max-width: 768px) {
  .hamburger {
    display: block;
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .nav-links {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #4a90e2;
    padding: 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .nav-links-open {
    display: flex;
  }

  .nav-link, .nav-button {
    width: 100%;
    text-align: left;
    padding: 0.75rem 1rem;
  }
}
</style>