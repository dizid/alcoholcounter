<template>
  <!-- Main menu navigation -->
  <nav class="main-menu">
    <!-- Brand with rotating drink icons -->
    <div class="nav-brand">
      <span class="nav-brand-icon" :key="currentDrink">{{ currentDrink }}</span>
      <span class="nav-brand-text">DrinkTracker</span>
    </div>

    <!-- Hamburger button for mobile -->
    <button
      class="hamburger"
      @click="toggleMenu"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      aria-controls="main-nav"
      aria-label="Toggle navigation menu"
    >
      <span class="hamburger-icon" aria-hidden="true">☰</span>
      <span class="hamburger-text">Menu</span>
    </button>

    <!-- Desktop navigation (inline) -->
    <ul class="nav-desktop" role="menubar">
      <template v-if="userStore.user">
        <li role="none">
          <router-link to="/" class="nav-link" role="menuitem" :aria-current="route.path === '/' ? 'page' : undefined">
            Track
          </router-link>
        </li>
        <li role="none">
          <router-link to="/dashboard" class="nav-link" role="menuitem" :aria-current="route.path === '/dashboard' ? 'page' : undefined">
            Dashboard
          </router-link>
        </li>
        <li role="none">
          <router-link to="/about-tracker" class="nav-link" role="menuitem" :aria-current="route.path === '/about-tracker' ? 'page' : undefined">
            About
          </router-link>
        </li>
        <li role="none">
          <router-link to="/feedback" class="nav-link" role="menuitem" :aria-current="route.path === '/feedback' ? 'page' : undefined">
            Feedback
          </router-link>
        </li>
        <li role="none"><button @click="handleLogout" class="nav-button" role="menuitem">Logout</button></li>
      </template>
      <template v-else>
        <li role="none">
          <router-link to="/login" class="nav-link" role="menuitem" :aria-current="route.path === '/login' ? 'page' : undefined">
            Login
          </router-link>
        </li>
      </template>
    </ul>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="isMenuOpen" class="nav-overlay" @click="closeMenu"></div>
    </Transition>

    <!-- Mobile slide-in panel -->
    <Transition name="slide">
      <div v-if="isMenuOpen" id="main-nav" class="nav-mobile" role="menu">
        <div class="nav-mobile-header">
          <div class="nav-brand">
            <span class="nav-brand-icon" :key="currentDrink">{{ currentDrink }}</span>
            <span class="nav-brand-text">DrinkTracker</span>
          </div>
          <button class="nav-close" @click="closeMenu" aria-label="Close menu">✕</button>
        </div>
        <ul class="nav-mobile-links">
          <template v-if="userStore.user">
            <li>
              <router-link to="/" class="nav-mobile-link" @click="closeMenu" :class="{ active: route.path === '/' }">
                <span class="nav-mobile-icon">📊</span> Track
              </router-link>
            </li>
            <li>
              <router-link to="/dashboard" class="nav-mobile-link" @click="closeMenu" :class="{ active: route.path === '/dashboard' }">
                <span class="nav-mobile-icon">📈</span> Dashboard
              </router-link>
            </li>
            <li>
              <router-link to="/about-tracker" class="nav-mobile-link" @click="closeMenu" :class="{ active: route.path === '/about-tracker' }">
                <span class="nav-mobile-icon">ℹ️</span> About
              </router-link>
            </li>
            <li>
              <router-link to="/feedback" class="nav-mobile-link" @click="closeMenu" :class="{ active: route.path === '/feedback' }">
                <span class="nav-mobile-icon">💬</span> Feedback
              </router-link>
            </li>
            <li class="nav-mobile-divider"></li>
            <li>
              <button @click="handleLogout" class="nav-mobile-link nav-mobile-button">
                <span class="nav-mobile-icon">🚪</span> Logout
              </button>
            </li>
          </template>
          <template v-else>
            <li>
              <router-link to="/login" class="nav-mobile-link" @click="closeMenu">
                <span class="nav-mobile-icon">🔑</span> Login
              </router-link>
            </li>
          </template>
        </ul>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { logout } from '../services/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isMenuOpen = ref(false)

// Rotating drink logos
const drinks = ['🍺', '🍷', '🥤', '🍊']
const drinkIndex = ref(0)
const currentDrink = ref(drinks[0])
let drinkInterval = null

onMounted(() => {
  drinkInterval = setInterval(() => {
    drinkIndex.value = (drinkIndex.value + 1) % drinks.length
    currentDrink.value = drinks[drinkIndex.value]
  }, 3000)
})

onUnmounted(() => {
  if (drinkInterval) {
    clearInterval(drinkInterval)
  }
})

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
/* Header bar - gradient glass effect */
.main-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to bottom,
    rgba(250, 252, 253, 0.98),
    rgba(240, 247, 244, 0.95));
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(16, 185, 129, 0.12);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
}

/* Brand logo */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.nav-brand-icon {
  font-size: 1.4rem;
  display: inline-block;
  animation: drinkPop 0.4s ease;
}

@keyframes drinkPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.nav-brand-text {
  font-size: 1.1rem;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

/* Hamburger button - mobile only */
.hamburger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

.hamburger:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
}

.hamburger-icon {
  font-size: 1.1rem;
}

.hamburger-text {
  font-weight: 500;
}

/* Desktop navigation - hidden on mobile by default */
.nav-desktop {
  display: none;
  gap: 0.5rem;
  align-items: center;
}

/* Soft card nav items */
.nav-link {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 10px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(16, 185, 129, 0.1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(16, 185, 129, 0.25);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
  transform: translateY(-1px);
  color: var(--accent);
}

.nav-link[aria-current="page"] {
  background: var(--accent-light);
  color: var(--accent);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.nav-button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(16, 185, 129, 0.1);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.04);
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Mobile overlay */
.nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}

/* Mobile slide-in panel */
.nav-mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--bg-primary);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 300;
  display: flex;
  flex-direction: column;
}

.nav-mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(16, 185, 129, 0.12);
  background: linear-gradient(to bottom,
    rgba(250, 252, 253, 0.98),
    rgba(240, 247, 244, 0.95));
}

.nav-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-mobile-links {
  padding: 0.75rem;
  flex: 1;
  overflow-y: auto;
}

.nav-mobile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: var(--text-primary);
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-mobile-link:hover {
  background: var(--bg-secondary);
}

.nav-mobile-link.active {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-mobile-button {
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
}

.nav-mobile-icon {
  font-size: 1.1rem;
  width: 1.5rem;
  text-align: center;
}

.nav-mobile-divider {
  height: 1px;
  background: var(--border);
  margin: 0.75rem 0;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Desktop styles */
@media (min-width: 768px) {
  .hamburger {
    display: none;
  }

  .nav-brand {
    display: flex;
  }

  .nav-desktop {
    display: flex;
  }

  .nav-mobile,
  .nav-overlay {
    display: none;
  }
}

/* Mobile: hide brand in header (shown in hamburger menu) */
@media (max-width: 767px) {
  .main-menu > .nav-brand {
    display: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>