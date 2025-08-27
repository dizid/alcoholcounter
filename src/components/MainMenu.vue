<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <router-link to="/" class="nav-link">Tracker</router-link>
    <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
    <router-link to="/about" class="nav-link">About</router-link>
    <router-link to="/feedback" class="nav-link">Feedback</router-link>
    <router-link to="/youtube" class="nav-link">YouTube</router-link>
    <router-link to="/references" class="nav-link">References</router-link>
    <button @click="handleLogout" class="nav-button">Logout</button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { logout } from '../services/auth'

const router = useRouter()

async function handleLogout() {
  try {
    await logout()
    router.push('/login')
  } catch (err) {
    console.error('Error logging out:', err)
  }
}
</script>

<style scoped>
.main-menu {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #4a90e2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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
</style>