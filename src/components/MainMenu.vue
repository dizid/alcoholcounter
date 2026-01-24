<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <!-- Hamburger icon for mobile with Menu text -->
    <button
      class="hamburger"
      @click="toggleMenu"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      aria-controls="main-nav"
      aria-label="Toggle navigation menu"
    >
      <span class="hamburger-icon" aria-hidden="true">{{ isMenuOpen ? '✖' : '☰' }}</span>
      <span class="hamburger-text"> Menu</span>
    </button>
    
    <!-- Navigation links -->
    <ul id="main-nav" :class="{ 'nav-links': true, 'nav-links-open': isMenuOpen }" role="menubar">
      <template v-if="userStore.user">
        <!-- Links shown when logged in -->
        <li role="none">
          <router-link to="/" class="nav-link" @click="closeMenu" role="menuitem" :aria-current="route.path === '/' ? 'page' : undefined">
            <span class="nav-icon" aria-hidden="true">+</span> Track
          </router-link>
        </li>
        <li role="none">
          <router-link to="/dashboard" class="nav-link" @click="closeMenu" role="menuitem" :aria-current="route.path === '/dashboard' ? 'page' : undefined">
            <span class="nav-icon" aria-hidden="true">=</span> Dashboard
          </router-link>
        </li>
        <li role="none">
          <router-link to="/about-tracker" class="nav-link" @click="closeMenu" role="menuitem" :aria-current="route.path === '/about-tracker' ? 'page' : undefined">
            <span class="nav-icon" aria-hidden="true">i</span> About
          </router-link>
        </li>
        <li role="none">
          <router-link to="/feedback" class="nav-link" @click="closeMenu" role="menuitem" :aria-current="route.path === '/feedback' ? 'page' : undefined">
            <span class="nav-icon" aria-hidden="true">?</span> Feedback
          </router-link>
        </li>
        <li role="none"><button @click="handleLogout" class="nav-button" role="menuitem">Logout</button></li>
        <li role="none">
          <button
            @click="toggleTheme"
            class="theme-toggle"
            role="menuitem"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span aria-hidden="true">{{ isDark ? '&#9788;' : '&#9790;' }}</span>
          </button>
        </li>
      </template>
      <template v-else>
        <!-- Links shown when logged out -->
        <li role="none">
          <router-link to="/login" class="nav-link" @click="closeMenu" role="menuitem" :aria-current="route.path === '/login' ? 'page' : undefined">
            Login
          </router-link>
        </li>
      </template>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { logout } from '../services/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isMenuOpen = ref(false)
const isDark = ref(false)

// Safe localStorage helpers (handles private browsing mode)
function safeLocalStorageGet(key, defaultValue = null) {
  try {
    return localStorage.getItem(key) ?? defaultValue
  } catch (e) {
    console.warn('localStorage not available:', e)
    return defaultValue
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn('localStorage not available:', e)
    return false
  }
}

// Initialize theme from localStorage or system preference
onMounted(() => {
  const savedTheme = safeLocalStorageGet('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Check system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

// Toggle between light and dark theme
function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
  safeLocalStorageSet('theme', isDark.value ? 'dark' : 'light')
}

// Apply theme to document
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

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
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.hamburger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
}

.hamburger-icon {
  font-size: 1.25rem;
}

.nav-links {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 12px var(--shadow);
}

.nav-links-open {
  display: block;
}

.nav-links li {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.nav-link:hover {
  background: var(--bg-tertiary);
  text-decoration: none;
}

.nav-icon {
  display: inline-block;
  width: 1.5rem;
  text-align: center;
  margin-right: 0.5rem;
  color: var(--text-secondary);
}

.nav-button {
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
}

.nav-button:hover {
  background: var(--bg-tertiary);
}

.theme-toggle {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--accent-light);
  border-color: var(--accent);
}

/* Desktop styles */
@media (min-width: 768px) {
  .hamburger {
    display: none;
  }

  .nav-links {
    display: flex;
    position: static;
    background: transparent;
    border: none;
    box-shadow: none;
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
  }

  .nav-button {
    padding: 0.5rem 0.75rem;
  }

  .theme-toggle {
    width: auto;
    padding: 0.5rem 0.75rem;
  }
}
</style>